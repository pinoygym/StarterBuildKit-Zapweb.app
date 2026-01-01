import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { userRepository } from '@/repositories/user.repository';
import { sessionRepository } from '@/repositories/session.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { 
  LoginInput, 
  RegisterInput, 
  AuthResponse, 
  JWTPayload,
  ResetPasswordInput,
  ForgotPasswordInput,
} from '@/types/auth.types';
import { CreateUserInput } from '@/types/user.types';
import { AuditAction, AuditResource } from '@/types/audit.types';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'your-secret-key-change-in-production' : '');
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

export class AuthService {
  /**
   * Register a new user
   */
  async registerUser(data: RegisterInput, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      return {
        success: false,
        message: 'Email already registered',
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Generate unique ID for user
    const userId = randomUUID();

    // Create user
    const user = await userRepository.create({
      id: userId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      Role: { connect: { id: data.roleId } },
      Branch: data.branchId ? { connect: { id: data.branchId } } : undefined,
      status: 'ACTIVE',
      emailVerified: false,
    });

    // Log the action
    await auditLogRepository.create({
      userId: user.id,
      action: AuditAction.USER_CREATED,
      resource: AuditResource.USER,
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'User registered successfully. Please verify your email.',
    };
  }

  /**
   * Login user
   */
  async login(credentials: LoginInput, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    // Find user by email
    const user = await userRepository.findByEmail(credentials.email);
    
    if (!user) {
      // Log failed attempt
      await auditLogRepository.create({
        action: AuditAction.USER_LOGIN_FAILED,
        resource: AuditResource.USER,
        details: { email: credentials.email, reason: 'User not found' },
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        message: 'Account is inactive or suspended',
      };
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return {
        success: false,
        message: 'Please verify your email before logging in',
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
    
    if (!isPasswordValid) {
      // Log failed attempt
      await auditLogRepository.create({
        userId: user.id,
        action: AuditAction.USER_LOGIN_FAILED,
        resource: AuditResource.USER,
        resourceId: user.id,
        details: { reason: 'Invalid password' },
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Determine session duration based on rememberMe
    const sessionDuration = credentials.rememberMe ? 30 * 24 : 24; // 30 days or 24 hours
    const expiresIn = credentials.rememberMe ? '30d' : '24h';

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      branchId: user.branchId || undefined,
    }, expiresIn);

    // Create session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + sessionDuration);

    await sessionRepository.create({
      userId: user.id,
      token,
      ipAddress,
      userAgent,
      expiresAt,
    });

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Log successful login
    await auditLogRepository.create({
      userId: user.id,
      action: AuditAction.USER_LOGIN,
      resource: AuditResource.USER,
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    // Get user permissions
    const permissions = (user.Role?.RolePermission || []).map(rp => 
      `${rp.Permission.resource}:${rp.Permission.action}`
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        branchId: user.branchId,
        status: user.status,
        emailVerified: user.emailVerified,
        branchLockEnabled: user.branchLockEnabled,
        Role: {
          id: user.Role.id,
          name: user.Role.name,
          description: user.Role.description,
        },
        Branch: user.Branch ? {
          id: user.Branch.id,
          name: user.Branch.name,
          code: user.Branch.code,
        } : undefined,
      },
      permissions,
    };
  }

  /**
   * Logout user
   */
  async logout(token: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    // Delete session
    await sessionRepository.deleteByToken(token);

    // Log logout
    if (userId) {
      await auditLogRepository.create({
        userId,
        action: AuditAction.USER_LOGOUT,
        resource: AuditResource.USER,
        resourceId: userId,
        ipAddress,
        userAgent,
      });
    }
  }

  /**
   * Validate session and get user
   */
  async validateSession(token: string) {
    const session = await sessionRepository.findByToken(token);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await sessionRepository.deleteByToken(token);
      return null;
    }

    // Check if user is still active
    if (session.User.status !== 'ACTIVE') {
      return null;
    }

    return session;
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await userRepository.findByEmail((await userRepository.findById(userId))!.email);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await userRepository.updatePassword(userId, newPasswordHash);

    // Invalidate all sessions
    await sessionRepository.deleteByUser(userId);

    // Log password change
    await auditLogRepository.create({
      userId,
      action: AuditAction.USER_PASSWORD_CHANGED,
      resource: AuditResource.USER,
      resourceId: userId,
      ipAddress,
      userAgent,
    });

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Verify email
   */
  async verifyEmail(userId: string): Promise<{ success: boolean; message: string }> {
    await userRepository.updateEmailVerified(userId, true);

    await auditLogRepository.create({
      userId,
      action: AuditAction.USER_EMAIL_VERIFIED,
      resource: AuditResource.USER,
      resourceId: userId,
    });

    return { success: true, message: 'Email verified successfully' };
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string = '24h'): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      if (!JWT_SECRET) return null;
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
