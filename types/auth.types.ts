import { User, Role, Branch } from '@prisma/client';

// Login/Register types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  branchId?: string;
}

// Password reset types
export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailInput {
  token: string;
}

// Auth response types
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  permissions?: string[];
  message?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  branchId: string | null;
  status: string;
  emailVerified: boolean;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// JWT payload type
export interface JWTPayload {
  userId: string;
  email: string;
  roleId: string;
  branchId?: string;
  iat: number;
  exp: number;
}

// Session types
export interface SessionData {
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

export interface SessionWithUser {
  id: string;
  userId: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    emailVerified: boolean;
    role: Role;
    branch: Branch | null;
  };
}

// Email verification token
export interface EmailVerificationToken {
  userId: string;
  email: string;
  exp: number;
}

// Password reset token
export interface PasswordResetTokenData {
  userId: string;
  email: string;
  exp: number;
}
