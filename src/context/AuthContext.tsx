import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../config/api';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored token on app start
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Set default Authorization header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (e) {
        console.error('Failed to load auth data', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting login');
      console.log('[AuthContext] Request payload:', { email, password: '***' });

      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      console.log('[AuthContext] Login response received:', response.status);

      const { access_token } = response.data;

      // Since our login only returns token, we decode or fetch user separately
      // For this MVP, we'll fake the user object or fetch it if we add a /me endpoint
      // Let's assume we can derive or need to fetch user. 
      // For simplicity/robustness match the current backend:

      setToken(access_token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      await AsyncStorage.setItem('userToken', access_token);

      // Placeholder user for now until we add /me endpoint
      const mockUser = { id: 1, email, name: email.split('@')[0] };
      setUser(mockUser);
      await AsyncStorage.setItem('userData', JSON.stringify(mockUser));

    } catch (error: any) {
      console.error('[AuthContext] Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting registration');
      console.log('[AuthContext] Request payload:', { name, email, password: '***' });

      const response = await apiClient.post('/auth/register', {
        name,
        email,
        password,
      });

      console.log('[AuthContext] Registration response received:', response.status);
      // Auto login after register
      await login(email, password);
    } catch (error: any) {
      console.error('[AuthContext] Registration error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      delete apiClient.defaults.headers.common['Authorization'];
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
