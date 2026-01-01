'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthResponse, LoginInput, RegisterInput } from '@/types/auth.types';
import { UserWithRelations } from '@/types/user.types';
import { useUser, useStackApp } from "@stackframe/stack";

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
  // Use Stack Auth hooks
  const stackUser = useUser();
  const app = useStackApp();

  // Local state to bridge the gap
  const [permissions, setPermissions] = useState<string[]>([]);
  // Simplified loading state
  const [isLoading, setIsLoading] = useState(false);

  // Map Stack User to our UserWithRelations
  const user: UserWithRelations | null = stackUser ? {
    id: stackUser.id,
    email: stackUser.primaryEmail || '',
    firstName: stackUser.displayName?.split(' ')[0] || '',
    lastName: stackUser.displayName?.split(' ').slice(1).join(' ') || '',
    phone: null,
    password: '', // Dummy for type satisfaction
    roleId: 'user',
    branchId: null,
    status: 'ACTIVE',
    emailVerified: true,
    lastLoginAt: new Date(),
    branchLockEnabled: false,
    isSuperMegaAdmin: false,
    createdAt: new Date(), // Fallback as stackUser.createdAt might be missing in type
    updatedAt: new Date(),
    Role: {
      id: 'user',
      name: 'User',
      description: 'Default Stack User',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    Branch: null,
    UserBranchAccess: []
  } as unknown as UserWithRelations : null;

  const login = async (credentials: LoginInput): Promise<AuthResponse> => {
    try {
      await app.signInWithCredential({ email: credentials.email, password: credentials.password });
      return { success: true };
    } catch (error) {
      console.error("Stack Login Error", error);
      return { success: false, message: (error as Error).message };
    }
  };

  const register = async (registerData: RegisterInput): Promise<AuthResponse> => {
    try {
      await app.signUpWithCredential({
        email: registerData.email,
        password: registerData.password,
        // Name removed as it's not supported in the basic sign up signature
      });
      return { success: true };
    } catch (error) {
      console.error("Stack Register Error", error);
      return { success: false, message: (error as Error).message };
    }
  };

  const logout = async () => {
    await app.signOut();
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    // Stack handles this automatically
  };

  const hasPermission = (resource: string, action: string): boolean => {
    // TODO: Implement permission fetching from your DB based on stackUser.id
    return true;
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return true;
  };

  const isSuperMegaAdmin = (): boolean => {
    return false; // Disable for now
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
