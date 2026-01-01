import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '@/services/auth.service';
import { userRepository } from '@/repositories/user.repository';
import { sessionRepository } from '@/repositories/session.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('@/repositories/user.repository', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
    updateLastLogin: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    updatePassword: vi.fn(),
    updateEmailVerified: vi.fn(),
  },
}));

vi.mock('@/repositories/session.repository', () => ({
  sessionRepository: {
    create: vi.fn(),
    deleteByToken: vi.fn(),
    findByToken: vi.fn(),
    deleteByUser: vi.fn(),
  },
}));

vi.mock('@/repositories/audit-log.repository', () => ({
  auditLogRepository: {
    create: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    const registerInput = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      roleId: 'role-123',
      branchId: 'branch-123',
    };

    it('should register a new user successfully', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      vi.mocked(userRepository.create).mockResolvedValue({
        id: 'user-123',
        ...registerInput,
        passwordHash: 'hashed-password',
        status: 'ACTIVE',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        roleId: registerInput.roleId,
        branchId: registerInput.branchId,
      } as any);

      const result = await authService.registerUser(registerInput);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(registerInput.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerInput.password, 12);
      expect(userRepository.create).toHaveBeenCalled();
      expect(auditLogRepository.create).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'User registered successfully. Please verify your email.',
      });
    });

    it('should return error if email already exists', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({ id: 'existing-user' } as any);

      const result = await authService.registerUser(registerInput);

      expect(result).toEqual({
        success: false,
        message: 'Email already registered',
      });
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginInput = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginInput.email,
        passwordHash: 'hashed-password',
        status: 'ACTIVE',
        emailVerified: true,
        firstName: 'John',
        lastName: 'Doe',
        roleId: 'role-123',
        branchId: 'branch-123',
        Role: {
          id: 'role-123',
          name: 'Admin',
          RolePermission: [
            { Permission: { resource: 'users', action: 'read' } }
          ]
        },
        Branch: { id: 'branch-123', name: 'Main Branch' }
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);

      const result = await authService.login(loginInput);

      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-token');
      expect(sessionRepository.create).toHaveBeenCalled();
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(auditLogRepository.create).toHaveBeenCalled();
    });

    it('should return error for invalid email', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      const result = await authService.login(loginInput);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
      expect(auditLogRepository.create).toHaveBeenCalled();
    });

    it('should return error for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginInput.email,
        passwordHash: 'hashed-password',
        status: 'ACTIVE',
        emailVerified: true,
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await authService.login(loginInput);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
      expect(auditLogRepository.create).toHaveBeenCalled();
    });

    it('should return error if user is inactive', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginInput.email,
        status: 'INACTIVE',
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);

      const result = await authService.login(loginInput);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Account is inactive or suspended');
    });

    it('should return error if email is not verified', async () => {
      const mockUser = {
        id: 'user-123',
        email: loginInput.email,
        status: 'ACTIVE',
        emailVerified: false,
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);

      const result = await authService.login(loginInput);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Please verify your email before logging in');
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const token = 'mock-token';
      const userId = 'user-123';

      await authService.logout(token, userId);

      expect(sessionRepository.deleteByToken).toHaveBeenCalledWith(token);
      expect(auditLogRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        action: 'USER_LOGOUT'
      }));
    });
  });

  describe('validateSession', () => {
    it('should return session if valid', async () => {
      const mockSession = {
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000), // Future
        User: { status: 'ACTIVE' }
      };

      vi.mocked(sessionRepository.findByToken).mockResolvedValue(mockSession as any);

      const result = await authService.validateSession('mock-token');

      expect(result).toBe(mockSession);
    });

    it('should return null if session not found', async () => {
      vi.mocked(sessionRepository.findByToken).mockResolvedValue(null);

      const result = await authService.validateSession('mock-token');

      expect(result).toBeNull();
    });

    it('should return null and delete session if expired', async () => {
      const mockSession = {
        token: 'mock-token',
        expiresAt: new Date(Date.now() - 3600000), // Past
        User: { status: 'ACTIVE' }
      };

      vi.mocked(sessionRepository.findByToken).mockResolvedValue(mockSession as any);

      const result = await authService.validateSession('mock-token');

      expect(result).toBeNull();
      expect(sessionRepository.deleteByToken).toHaveBeenCalledWith('mock-token');
    });

    it('should return null if user is inactive', async () => {
      const mockSession = {
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000),
        User: { status: 'INACTIVE' }
      };

      vi.mocked(sessionRepository.findByToken).mockResolvedValue(mockSession as any);

      const result = await authService.validateSession('mock-token');

      expect(result).toBeNull();
    });
  });
});
