'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signInWithGooglePopup } from '@/lib/google-oauth';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isEmailVerified: boolean;
  provider: 'email' | 'google';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  googleLogin: () => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  verifyEmail: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  apiCall: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize auth state from localStorage and verify token
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          setAccessToken(token);
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.data.user);
          } else if (response.status === 401) {
            // Token expired or invalid, try to refresh
            const refreshed = await refreshToken();
            if (!refreshed) {
              // Refresh failed, clear everything
              localStorage.removeItem('accessToken');
              setAccessToken(null);
              setUser(null);
            }
          } else {
            // Other error, clear tokens
            localStorage.removeItem('accessToken');
            setAccessToken(null);
            setUser(null);
          }
        } else {
          // No access token, try refresh token
          const refreshed = await refreshToken();
          if (!refreshed) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('accessToken');
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        localStorage.setItem('accessToken', data.data.accessToken);
        return { success: true };
      } else {
        // Check for email verification requirement
        if (data.error === 'Please verify your email before logging in') {
          throw new Error(`EMAIL_VERIFICATION_REQUIRED:${email}`);
        }
        throw new Error(data.error || 'Login failed');
      }
    } catch (error: any) {
      if (error.message.startsWith('EMAIL_VERIFICATION_REQUIRED:')) {
        throw error;
      }
      throw new Error(error.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithGooglePopup();
      
      if (result.success && result.user) {
        // result.user now contains the full response from the backend
        const { accessToken, user } = result.user as any;
        setAccessToken(accessToken);
        setUser(user);
        localStorage.setItem('accessToken', accessToken);
        return { success: true };
      } else {
        throw new Error(result.error || 'Google login failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Google login error');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true };
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call server logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include', // Include cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all client-side auth state
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      
      // Force reload to clear any cached state
      window.location.href = '/signin';
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include httpOnly cookies
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        localStorage.setItem('accessToken', data.data.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        localStorage.setItem('accessToken', data.data.accessToken);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Email verification failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const resendOTP = async (email: string) => {
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to resend OTP' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  // API call wrapper that automatically handles token refresh
  const apiCall = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If token expired, try to refresh and retry
    if (response.status === 401 && accessToken) {
      const refreshed = await refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    return response;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    googleLogin,
    register,
    logout,
    refreshToken,
    verifyEmail,
    resendOTP,
    apiCall,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
