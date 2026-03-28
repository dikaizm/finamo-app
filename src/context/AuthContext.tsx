import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { 
  login as authLogin, 
  register as authRegister, 
  logout as authLogout,
  restoreSession,
  getCurrentUser,
  isAuthenticated,
  hasStoredSession,
  getAccessToken,
  LoginResponse,
  UserResponse
} from '../services/authService';
import { LogoutModal } from '../components/LogoutModal';

/**
 * Authentication Context
 * 
 * Provides authentication state and methods to the app.
 * Uses secure storage for refresh tokens and in-memory storage for access tokens.
 * 
 * SECURITY NOTES:
 * - Access tokens are NEVER persisted (only in memory)
 * - Refresh tokens are stored in OS-level secure storage (expo-secure-store)
 * - Automatic token refresh on 401 errors via axios interceptors
 * - Session restoration on app startup using refresh token
 */

interface AuthContextType {
  // State
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  showLogoutModal: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<void>;
  logout: (allDevices?: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
  hideLogoutModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * 
 * Wraps the app and provides authentication context to all children.
 * Handles automatic session restoration on app startup.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  /**
   * Hide logout modal
   */
  const hideLogoutModal = useCallback(() => {
    setShowLogoutModal(false);
  }, []);

  /**
   * Initialize auth state on app start
   * Attempts to restore session if refresh token exists
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a stored session
        const hasSession = await hasStoredSession();
        
        if (hasSession) {
          console.log('[AuthContext] Found stored session, attempting restore...');
          
          // Try to restore session using refresh token
          const restored = await restoreSession();
          
          if (restored) {
            console.log('[AuthContext] Session restored successfully');
            setUser(restored);
          } else {
            console.log('[AuthContext] Session restore failed, showing logout modal');
            // Session expired or invalid - show friendly logout modal
            setShowLogoutModal(true);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Failed to initialize auth:', error);
        // On error, also show logout modal
        setShowLogoutModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      console.log('[AuthContext] Attempting login...');
      
      const response: LoginResponse = await authLogin(email, password);
      
      console.log('[AuthContext] Login successful');
      setUser(response.user);
    } catch (error: any) {
      console.error('[AuthContext] Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }, []);

  /**
   * Register new user account
   * Automatically logs in after successful registration
   */
  const register = useCallback(async (
    name: string, 
    email: string, 
    password: string,
    confirmPassword?: string
  ): Promise<void> => {
    try {
      console.log('[AuthContext] Attempting registration...');
      
      const response: LoginResponse = await authRegister(name, email, password, confirmPassword);
      
      console.log('[AuthContext] Registration successful');
      setUser(response.user);
    } catch (error: any) {
      console.error('[AuthContext] Registration error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }, []);

  /**
   * Logout user
   * @param allDevices If true, logout from all devices (revoke all tokens)
   */
  const logout = useCallback(async (allDevices: boolean = false): Promise<void> => {
    try {
      console.log(`[AuthContext] Logging out${allDevices ? ' (all devices)' : ''}...`);
      
      await authLogout(allDevices);
      
      console.log('[AuthContext] Logout successful');
      setUser(null);
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
    }
  }, []);

  /**
   * Refresh current user data from server
   * Useful after profile updates or to verify token validity
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      if (!isAuthenticated()) {
        console.log('[AuthContext] Cannot refresh user: not authenticated');
        return;
      }
      
      console.log('[AuthContext] Refreshing user data...');
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('[AuthContext] Failed to refresh user:', error);
      throw error;
    }
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    // Clear any stored session data
    try {
      await authLogout(false);
    } catch (error) {
      console.error('[AuthContext] Error during modal logout:', error);
    }
    setShowLogoutModal(false);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    showLogoutModal,
    login,
    register,
    logout,
    refreshUser,
    hideLogoutModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={hideLogoutModal}
      />
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * 
 * Custom hook to access authentication context.
 * Must be used within AuthProvider.
 * 
 * @throws Error if used outside AuthProvider
 * @returns AuthContextType with auth state and methods
 * 
 * @example
 * ```tsx
 * const { user, login, logout, isAuthenticated } = useAuth();
 * 
 * if (isAuthenticated) {
 *   return <Text>Welcome, {user.name}!</Text>;
 * }
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * useAuthenticatedUser Hook
 * 
 * Returns the current user or throws if not authenticated.
 * Useful for screens that require authentication.
 * 
 * @throws Error if user is not authenticated
 * @returns Current user object
 */
export const useAuthenticatedUser = (): UserResponse => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    throw new Error('useAuthenticatedUser called when user is not authenticated');
  }
  
  return user;
};
