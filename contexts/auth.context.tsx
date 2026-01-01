'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthResponse, LoginInput, RegisterInput } from '@/types/auth.types';
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
  isSuperMegaAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserWithRelations | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user on mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        setPermissions(data.permissions || []);
      } else {
        setUser(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      setUser(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginInput): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh user data after successful login
        await fetchCurrentUser();
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred during login'
      };
    }
  };

  const register = async (registerData: RegisterInput): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh user data after successful registration
        await fetchCurrentUser();
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred during registration'
      };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      setPermissions([]);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setPermissions([]);
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;

    // Super mega admin has all permissions
    if (user.isSuperMegaAdmin) return true;

    // Check if permission exists in user's permissions
    const permissionString = `${resource}:${action}`;
    return permissions.includes(permissionString);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    if (!user) return false;

    // Super mega admin has all permissions
    if (user.isSuperMegaAdmin) return true;

    // Check if user has any of the required permissions
    return requiredPermissions.some(perm => permissions.includes(perm));
  };

  const isSuperMegaAdmin = (): boolean => {
    return user?.isSuperMegaAdmin || false;
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
    isSuperMegaAdmin,
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
