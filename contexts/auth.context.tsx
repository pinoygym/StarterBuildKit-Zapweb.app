'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthResponse, JWTPayload, LoginInput, RegisterInput } from '@/types/auth.types';
import { UserWithRelations } from '@/types/user.types';

interface AuthContextType {
  user: UserWithRelations | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<AuthResponse>;
  register: (data: RegisterInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserWithRelations | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Ensure cookies are sent
        cache: 'no-store', // Prevent caching in Chrome
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setPermissions(data.permissions || []);
      } else if (response.status === 401) {
        // User is not authenticated - this is expected on public pages
        // Don't log an error, just silently set loading to false
        setUser(null);
        setPermissions([]);
      }
    } catch (error) {
      // Only log unexpected errors (network issues, etc.)
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginInput): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.user) {
        setUser(data.user as any);
        setPermissions(data.permissions || []);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const register = async (registerData: RegisterInput): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      const data: AuthResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'An error occurred during registration' };
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Ensure cookies are sent
      });
      console.log('Logout API response:', response.status, response.statusText);

      if (response.ok) {
        console.log('Logout successful, clearing user state and redirecting...');
        setUser(null);
        setPermissions([]);
        window.location.href = '/login';
      } else {
        console.error('Logout API failed:', response.status, await response.text());
        // Still clear state and redirect even if API fails
        setUser(null);
        setPermissions([]);
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear state and redirect even if there's an error
      setUser(null);
      setPermissions([]);
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const hasPermission = (resource: string, action: string): boolean => {
    const permissionString = `${resource}:${action}`;
    return permissions.includes(permissionString);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some((permission) => permissions.includes(permission));
  };

  const value: AuthContextType = {
    user,
    permissions,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    hasPermission,
    hasAnyPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
