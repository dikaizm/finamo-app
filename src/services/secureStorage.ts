import * as SecureStore from 'expo-secure-store';

/**
 * Secure Token Storage Service
 * 
 * This service handles persistent storage of refresh tokens using OS-level
 * secure storage (iOS Keychain / Android Keystore).
 * 
 * SECURITY PRINCIPLES:
 * - Access tokens are NEVER stored persistently (in-memory only)
 * - Refresh tokens are stored ONLY in secure storage (not AsyncStorage)
 * - Tokens are encrypted at rest by the OS
 * 
 * For Expo: uses expo-secure-store
 * For bare React Native: would use react-native-keychain
 */

// Storage keys - kept separate to avoid accidental collision
const REFRESH_TOKEN_KEY = 'finamo_refresh_token';
const DEVICE_ID_KEY = 'finamo_device_id';

/**
 * Store refresh token in secure storage.
 * 
 * @param token The refresh token to store
 * @returns Promise that resolves when stored
 */
export async function storeRefreshToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('[SecureStorage] Failed to store refresh token:', error);
    throw new Error('Failed to securely store refresh token');
  }
}

/**
 * Retrieve refresh token from secure storage.
 * 
 * @returns The stored refresh token, or null if not found
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('[SecureStorage] Failed to retrieve refresh token:', error);
    return null;
  }
}

/**
 * Remove refresh token from secure storage.
 * Called on logout to ensure token cannot be reused.
 * 
 * @returns Promise that resolves when deleted
 */
export async function removeRefreshToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('[SecureStorage] Failed to remove refresh token:', error);
    // Don't throw - we want logout to succeed even if deletion fails
  }
}

/**
 * Check if a refresh token exists in secure storage.
 * Used to determine if user has an existing session.
 * 
 * @returns True if refresh token exists
 */
export async function hasRefreshToken(): Promise<boolean> {
  const token = await getRefreshToken();
  return token !== null;
}

// ============================================
// DEVICE ID MANAGEMENT
// ============================================

/**
 * Generate a unique device identifier.
 * This should remain constant for the app installation.
 * 
 * @returns A unique device identifier string
 */
function generateDeviceId(): string {
  // Generate a UUID-like string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get or create a persistent device identifier.
 * This ID is used to bind refresh tokens to specific devices.
 * 
 * @returns The device identifier string
 */
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate new device ID on first run
      deviceId = generateDeviceId();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
      console.log('[SecureStorage] Generated new device ID');
    }
    
    return deviceId;
  } catch (error) {
    console.error('[SecureStorage] Failed to get device ID:', error);
    // Fallback to a generated ID (won't persist, but allows app to function)
    return generateDeviceId();
  }
}

/**
 * Clear all authentication-related data from secure storage.
 * Used on complete sign-out or app reset.
 * 
 * @returns Promise that resolves when all data is cleared
 */
export async function clearAllAuthData(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      // Note: We keep device_id to maintain device binding consistency
    ]);
  } catch (error) {
    console.error('[SecureStorage] Failed to clear auth data:', error);
  }
}

/**
 * Debug helper to check storage status (development only).
 * DO NOT use in production - logging tokens is a security risk.
 */
export async function debugStorageStatus(): Promise<{ hasToken: boolean; hasDeviceId: boolean }> {
  if (__DEV__) {
    const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    const deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    return {
      hasToken: token !== null,
      hasDeviceId: deviceId !== null,
    };
  }
  return { hasToken: false, hasDeviceId: false };
}
