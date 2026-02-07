import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import Constants from 'expo-constants';
import { 
  storeRefreshToken, 
  getRefreshToken, 
  removeRefreshToken, 
  getDeviceId 
} from './secureStorage';

/**
 * Authentication API Service
 * 
 * This service handles all authentication-related API calls with automatic
 * token refresh using axios interceptors.
 * 
 * SECURITY FEATURES:
 * - Access tokens are stored in-memory only (never persisted)
 * - Refresh tokens are stored in OS-level secure storage
 * - Automatic token refresh on 401 errors
 * - Request queueing during refresh to prevent race conditions
 * - Device binding for refresh tokens
 */

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8077';
const API_VERSION = '/v1';
const BASE_URL = `${API_BASE_URL}${API_VERSION}`;

// Token response interface
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// User response interface
interface UserResponse {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

// Login response interface
interface LoginResponse {
  user: UserResponse;
  tokens: TokenResponse;
}

// ============================================
// IN-MEMORY ACCESS TOKEN STORE
// ============================================

/**
 * Access token is stored only in memory - NEVER persisted to disk.
 * This reduces attack surface if device is compromised.
 */
let inMemoryAccessToken: string | null = null;

/**
 * Flag to prevent multiple simultaneous refresh attempts
 */
let isRefreshing = false;

/**
 * Queue of requests waiting for token refresh
 */
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Subscribe to token refresh
 */
function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers that token has been refreshed
 */
function onTokenRefreshed(newToken: string): void {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
}

// ============================================
// AXIOS INSTANCE
// ============================================

/**
 * Create axios instance with default configuration
 */
export const authApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

/**
 * Request interceptor: Attach access token to all requests
 */
authApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    // Don't attach token for auth endpoints (login, register, refresh)
    const isAuthEndpoint = config.url?.startsWith('/auth/') && 
                          !config.url?.includes('/logout') &&
                          !config.url?.includes('/me');
    
    if (!isAuthEndpoint && inMemoryAccessToken) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    
    // Add device ID header for device binding
    const deviceId = await getDeviceId();
    config.headers['X-Device-ID'] = deviceId;
    
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR (AUTO REFRESH)
// ============================================

/**
 * Response interceptor: Handle 401 errors with automatic token refresh
 */
authApi.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: AxiosError): Promise<AxiosResponse | never> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If error is not 401 or request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    
    // Don't retry auth endpoints (login, register, refresh)
    if (originalRequest.url?.startsWith('/auth/')) {
      return Promise.reject(error);
    }
    
    // Mark request as retried to prevent infinite loops
    originalRequest._retry = true;
    
    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(authApi(originalRequest));
        });
      });
    }
    
    // Start refresh process
    isRefreshing = true;
    
    try {
      const newToken = await performTokenRefresh();
      
      if (newToken) {
        // Update in-memory token
        setAccessToken(newToken);
        
        // Notify all queued requests
        onTokenRefreshed(newToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return authApi(originalRequest);
      }
    } catch (refreshError) {
      // Refresh failed - clear tokens and reject
      await logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// TOKEN REFRESH LOGIC
// ============================================

/**
 * Perform token refresh using stored refresh token.
 * 
 * @returns New access token or null if refresh failed
 */
async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  const deviceId = await getDeviceId();
  
  if (!refreshToken) {
    console.error('[AuthService] No refresh token available');
    return null;
  }
  
  try {
    const response = await axios.post<TokenResponse>(
      `${BASE_URL}/auth/refresh`,
      {
        refresh_token: refreshToken,
        device_id: deviceId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const { access_token, refresh_token: newRefreshToken } = response.data;
    
    // Store new refresh token (rotation)
    await storeRefreshToken(newRefreshToken);
    
    return access_token;
  } catch (error) {
    console.error('[AuthService] Token refresh failed:', error);
    
    // If refresh fails with 401, the refresh token is invalid/revoked
    // Clear all tokens and force re-authentication
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await clearAllTokens();
    }
    
    throw error;
  }
}

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/**
 * Set access token in memory.
 * Called after successful login or token refresh.
 * 
 * @param token The access token to store in memory
 */
export function setAccessToken(token: string): void {
  inMemoryAccessToken = token;
}

/**
 * Get current access token from memory.
 * 
 * @returns Current access token or null
 */
export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

/**
 * Clear all tokens (memory + secure storage).
 * Called on logout or auth failure.
 */
export async function clearAllTokens(): Promise<void> {
  inMemoryAccessToken = null;
  await removeRefreshToken();
}

/**
 * Check if user is authenticated (has access token in memory).
 * Note: This does NOT check if token is valid, only if it exists.
 * 
 * @returns True if access token exists
 */
export function isAuthenticated(): boolean {
  return inMemoryAccessToken !== null;
}

/**
 * Check if user has a stored session (refresh token exists).
 * Used on app startup to determine if we should try to restore session.
 * 
 * @returns True if refresh token exists in secure storage
 */
export async function hasStoredSession(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  return refreshToken !== null;
}

// ============================================
// AUTHENTICATION API CALLS
// ============================================

/**
 * Login user with email and password.
 * 
 * @param email User email
 * @param password User password
 * @returns User data and tokens
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const deviceId = await getDeviceId();
  const userAgent = `FinamoMobile/${Constants.expoConfig?.version || '1.0.0'}`;
  
  const response = await authApi.post<LoginResponse>('/auth/login', {
    email,
    password,
    device_id: deviceId,
    user_agent: userAgent,
  });
  
  const { user, tokens } = response.data;
  
  // Store tokens
  inMemoryAccessToken = tokens.access_token;
  await storeRefreshToken(tokens.refresh_token);
  
  return response.data;
}

/**
 * Register new user account.
 * 
 * @param name User full name
 * @param email User email
 * @param password User password
 * @returns Created user data and tokens
 */
export async function register(
  name: string, 
  email: string, 
  password: string
): Promise<LoginResponse> {
  const deviceId = await getDeviceId();
  const userAgent = `FinamoMobile/${Constants.expoConfig?.version || '1.0.0'}`;
  
  const response = await authApi.post<LoginResponse>('/auth/register', {
    name,
    email,
    password,
    device_id: deviceId,
    user_agent: userAgent,
  });
  
  // Auto-login after register
  const { user, tokens } = response.data;
  inMemoryAccessToken = tokens.access_token;
  await storeRefreshToken(tokens.refresh_token);
  
  return response.data;
}

/**
 * Logout user and revoke tokens.
 * 
 * @param allDevices If true, revoke all device tokens (logout everywhere)
 */
export async function logout(allDevices: boolean = false): Promise<void> {
  try {
    const refreshToken = await getRefreshToken();
    
    // Call logout endpoint if we have a token
    if (refreshToken) {
      await authApi.post('/auth/logout', {
        refresh_token: refreshToken,
        all_devices: allDevices,
      });
    }
  } catch (error) {
    // Log error but don't fail - we still want to clear local tokens
    console.error('[AuthService] Logout API call failed:', error);
  } finally {
    // Always clear local tokens
    await clearAllTokens();
  }
}

/**
 * Restore session on app startup.
 * Attempts to refresh tokens if a refresh token exists.
 * 
 * @returns User data if session restored, null otherwise
 */
export async function restoreSession(): Promise<UserResponse | null> {
  const refreshToken = await getRefreshToken();
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    const accessToken = await performTokenRefresh();
    
    if (accessToken) {
      inMemoryAccessToken = accessToken;
      
      // TODO: Fetch user data from /auth/me endpoint once implemented
      // For now, return minimal user info
      return null; // Will be updated when /me endpoint is ready
    }
  } catch (error) {
    console.error('[AuthService] Session restore failed:', error);
  }
  
  return null;
}

/**
 * Get current user info.
 * Requires valid access token.
 * 
 * @returns Current user data
 */
export async function getCurrentUser(): Promise<UserResponse> {
  const response = await authApi.get<UserResponse>('/auth/me');
  return response.data;
}

// ============================================
// EXPORTS
// ============================================

export type { TokenResponse, UserResponse, LoginResponse };
export default authApi;
