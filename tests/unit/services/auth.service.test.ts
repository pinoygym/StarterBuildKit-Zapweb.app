import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService } from '@/services/auth.service';
import { userRepository } from '@/repositories/user.repository';
import { sessionRepository } from '@/repositories/session.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { DatabaseTestBase, TestUtils } from '@/tests/helpers/test-base';
import { createTestUser, createTestBranch } from '@/tests/helpers/test-db-utils';
import { mockFetch, mockConsole } from '@/tests/helpers/mock-services';

// Mock dependencies
vi.mock('@/repositories/user.repository');
vi.mock('@/repositories/session.repository');
vi.mock('@/repositories/audit-log.repository');
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

// Mock environment variables
vi.mock('process', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret',
    JWT_EXPIRATION: '24h',
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let dbTestBase: DatabaseTestBase;
  let testUserId: string;
  let testBranchId: string;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Initialize database test base
    dbTestBase = new DatabaseTestBase();
    await dbTestBase.setup();

    // Create test data
    const branch = await createTestBranch();
    testBranchId = branch.id;

    const user = await createTestUser({
      branchId: testBranchId,
      emailVerified: true,
      status: 'ACTIVE'
    });
    testUserId = user.id;

    // Initialize service
    authService = new AuthService();

    // Setup common mocks
    mockConsole();
  });

  afterEach(async () => {
    await dbTestBase.teardown();
  });

  describe('registerUser', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      roleId: 'user-role-id',
      branchId: testBranchId,
    };

    it('should register user successfully', async () => {
      const mockUser = {
        id: TestUtils.generate.id(),
        ...registerData,
        passwordHash: 'hashed-password',
        status: 'ACTIVE',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        Branch: null,
        Role: {
          id: 'user-role-id',
          name: 'USER',
          description: 'Regular user',
          createdAt: new Date(),
          updatedAt: new Date(),
          isSystem: true,
        },
      };

      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(null);

      const mockCreate = vi.mocked(userRepository.create);
      mockCreate.mockResolvedValue(mockUser);

      const mockAuditCreate = vi.mocked(auditLogRepository.create);
      mockAuditCreate.mockResolvedValue({} as any);

      const result = await authService.registerUser(registerData);

      expect(mockFindByEmail).toHaveBeenCalledWith(registerData.email);
      expect(mockCreate).toHaveBeenCalled();
      expect(mockAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_CREATED',
          resource: 'USER',
          resourceId: mockUser.id,
        })
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('Please verify your email');
    });

    it('should return error when email already exists', async () => {
      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue({} as any);

      const result = await authService.registerUser(registerData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email already registered');
    });
  });

  describe('login', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: testUserId,
        email: loginCredentials.email,
        passwordHash: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 'user-role-id',
        branchId: testBranchId,
        status: 'ACTIVE',
        emailVerified: true,
        Role: {
          id: 'user-role-id',
          name: 'USER',
          description: 'Regular user',
          RolePermission: [],
        },
        Branch: {
          id: testBranchId,
          name: 'Test Branch',
          code: 'TB123',
        },
      };

      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(mockUser as any);

      const mockCreateSession = vi.mocked(sessionRepository.create);
      mockCreateSession.mockResolvedValue({} as any);

      const mockUpdateLastLogin = vi.mocked(userRepository.updateLastLogin);
      mockUpdateLastLogin.mockResolvedValue({} as any);

      const mockAuditCreate = vi.mocked(auditLogRepository.create);
      mockAuditCreate.mockResolvedValue({} as any);

      // Mock bcrypt and jwt
      const bcrypt = await import('bcryptjs');
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      const jwt = await import('jsonwebtoken');
      vi.mocked(jwt.sign).mockReturnValue('mock-jwt-token');

      const result = await authService.login(loginCredentials);

      expect(mockFindByEmail).toHaveBeenCalledWith(loginCredentials.email);
      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toBeDefined();
      expect(result.permissions).toEqual([]);
    });

    it('should return error when user not found', async () => {
      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(null);

      const mockAuditCreate = vi.mocked(auditLogRepository.create);
      mockAuditCreate.mockResolvedValue({} as any);

      const result = await authService.login(loginCredentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });

    it('should return error when user is inactive', async () => {
      const mockUser = {
        id: testUserId,
        email: loginCredentials.email,
        status: 'INACTIVE',
      };

      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(mockUser as any);

      const result = await authService.login(loginCredentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Account is inactive or suspended');
    });

    it('should return error when email not verified', async () => {
      const mockUser = {
        id: testUserId,
        email: loginCredentials.email,
        status: 'ACTIVE',
        emailVerified: false,
      };

      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(mockUser as any);

      const result = await authService.login(loginCredentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Please verify your email before logging in');
    });

    it('should return error when password is invalid', async () => {
      const mockUser = {
        id: testUserId,
        email: loginCredentials.email,
        passwordHash: 'hashed-password',
        status: 'ACTIVE',
        emailVerified: true,
      };

      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(mockUser as any);

      const mockAuditCreate = vi.mocked(auditLogRepository.create);
      mockAuditCreate.mockResolvedValue({} as any);

      // Mock bcrypt to return false
      const bcrypt = await import('bcryptjs');
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      const result = await authService.login(loginCredentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });

    it('should throw error when JWT_SECRET is not configured', async () => {
      // Temporarily remove JWT_SECRET
      const originalEnv = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const mockUser = {
        id: testUserId,
        email: loginCredentials.email,
        passwordHash: 'hashed-password',
        status: 'ACTIVE',
        emailVerified: true,
      };

      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(mockUser as any);

      const bcrypt = await import('bcryptjs');
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      await expect(authService.login(loginCredentials)).rejects.toThrow('JWT_SECRET is not configured');

      // Restore JWT_SECRET
      process.env.JWT_SECRET = originalEnv;
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockDeleteByToken = vi.mocked(sessionRepository.deleteByToken);
      mockDeleteByToken.mockResolvedValue({} as any);

      const mockAuditCreate = vi.mocked(auditLogRepository.create);
      mockAuditCreate.mockResolvedValue({} as any);

      await authService.logout('mock-token', testUserId);

      expect(mockDeleteByToken).toHaveBeenCalledWith('mock-token');
      expect(mockAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          action: 'USER_LOGOUT',
        })
      );
    });

    it('should logout without audit log when userId not provided', async () => {
      const mockDeleteByToken = vi.mocked(sessionRepository.deleteByToken);
      mockDeleteByToken.mockResolvedValue({} as any);

      await authService.logout('mock-token');

      expect(mockDeleteByToken).toHaveBeenCalledWith('mock-token');
    });
  });

  describe('validateSession', () => {
    it('should return session when valid', async () => {
      const mockSession = {
        id: 'session-id',
        userId: testUserId,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        User: {
          id: testUserId,
          status: 'ACTIVE',
        },
      };

      const mockFindByToken = vi.mocked(sessionRepository.findByToken);
      mockFindByToken.mockResolvedValue(mockSession as any);

      const result = await authService.validateSession('valid-token');

      expect(mockFindByToken).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual(mockSession);
    });

    it('should return null when session not found', async () => {
      const mockFindByToken = vi.mocked(sessionRepository.findByToken);
      mockFindByToken.mockResolvedValue(null);

      const result = await authService.validateSession('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null when session expired', async () => {
      const mockSession = {
        id: 'session-id',
        userId: testUserId,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        User: {
          id: testUserId,
          status: 'ACTIVE',
        },
      };

      const mockFindByToken = vi.mocked(sessionRepository.findByToken);
      mockFindByToken.mockResolvedValue(mockSession as any);

      const mockDeleteByToken = vi.mocked(sessionRepository.deleteByToken);
      mockDeleteByToken.mockResolvedValue({} as any);

      const result = await authService.validateSession('expired-token');

      expect(mockDeleteByToken).toHaveBeenCalledWith('expired-token');
      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const mockSession = {
        id: 'session-id',
        userId: testUserId,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
        User: {
          id: testUserId,
          status: 'INACTIVE',
        },
      };

      const mockFindByToken = vi.mocked(sessionRepository.findByToken);
      mockFindByToken.mockResolvedValue(mockSession as any);

      const result = await authService.validateSession('valid-token');

      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    const passwordData = {
      oldPassword: 'oldpassword123',
      newPassword: 'newpassword123',
    };

    it('should change password successfully', async () => {
      const mockUser = {
        id: testUserId,
        email: 'test@example.com',
        passwordHash: 'old-hashed-password',
      };

      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(mockUser as any);

      const mockUpdatePassword = vi.mocked(userRepository.updatePassword);
      mockUpdatePassword.mockResolvedValue({} as any);

      const mockDeleteByUser = vi.mocked(sessionRepository.deleteByUser);
      mockDeleteByUser.mockResolvedValue({} as any);

      const mockAuditCreate = vi.mocked(auditLogRepository.create);
      mockAuditCreate.mockResolvedValue({} as any);

      // Mock bcrypt
      const bcrypt = await import('bcryptjs');
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      vi.mocked(bcrypt.hash).mockResolvedValue('new-hashed-password');

      const result = await authService.changePassword(testUserId, passwordData.oldPassword, passwordData.newPassword);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
      expect(mockUpdatePassword).toHaveBeenCalledWith(testUserId, 'new-hashed-password');
      expect(mockDeleteByUser).toHaveBeenCalledWith(testUserId);
    });

    it('should return error when user not found', async () => {
      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(null);

      const result = await authService.changePassword(testUserId, passwordData.oldPassword, passwordData.newPassword);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });

    it('should return error when old password is incorrect', async () => {
      const mockUser = {
        id: testUserId,
        email: 'test@example.com',
        passwordHash: 'old-hashed-password',
      };

      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(mockUser as any);

      // Mock bcrypt to return false for old password
      const bcrypt = await import('bcryptjs');
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      const result = await authService.changePassword(testUserId, passwordData.oldPassword, passwordData.newPassword);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Current password is incorrect');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockUpdateEmailVerified = vi.mocked(userRepository.updateEmailVerified);
      mockUpdateEmailVerified.mockResolvedValue({} as any);

      const mockAuditCreate = vi.mocked(auditLogRepository.create);
      mockAuditCreate.mockResolvedValue({} as any);

      const result = await authService.verifyEmail(testUserId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
      expect(mockUpdateEmailVerified).toHaveBeenCalledWith(testUserId, true);
      expect(mockAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          action: 'USER_EMAIL_VERIFIED',
        })
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const jwt = require('jsonwebtoken');
      vi.mocked(jwt.verify).mockReturnValue({
        userId: testUserId,
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const result = authService.verifyToken('valid-token');

      expect(result).toBeDefined();
      expect(result?.userId).toBe(testUserId);
    });

    it('should return null for invalid token', () => {
      const jwt = require('jsonwebtoken');
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = authService.verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null when JWT_SECRET is not configured', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const result = authService.verifyToken('any-token');

      expect(result).toBeNull();

      // Restore
      process.env.JWT_SECRET = originalSecret;
    });
  });
});