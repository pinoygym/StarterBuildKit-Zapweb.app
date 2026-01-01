import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '@/services/auth.service';
import { userRepository } from '@/repositories/user.repository';
import { sessionRepository } from '@/repositories/session.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { roleRepository } from '@/repositories/role.repository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('@/repositories/user.repository', () => ({
    userRepository: {
        findByEmail: vi.fn(),
        create: vi.fn(),
        updateLastLogin: vi.fn(),
        findById: vi.fn(),
        updatePassword: vi.fn(),
        updateEmailVerified: vi.fn(),
    },
}));

vi.mock('@/repositories/session.repository', () => ({
    sessionRepository: {
        create: vi.fn(),
        findByToken: vi.fn(),
        deleteByToken: vi.fn(),
        deleteByUser: vi.fn(),
    },
}));

vi.mock('@/repositories/audit-log.repository', () => ({
    auditLogRepository: {
        create: vi.fn(),
    },
}));

vi.mock('@/repositories/role.repository', () => ({
    roleRepository: {
        findByName: vi.fn(),
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
    // Mock data
    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        roleId: 'role-123',
        status: 'ACTIVE',
        emailVerified: true,
        Role: {
            id: 'role-123',
            name: 'Cashier',
            description: 'Cashier role',
            RolePermission: [
                { Permission: { resource: 'PRODUCTS', action: 'READ' } }
            ]
        },
        Branch: {
            id: 'branch-123',
            name: 'Main Branch',
            code: 'MB'
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        authService = new AuthService();

        // Default crypto mock
        // Default crypto mock
        vi.mock('crypto', () => {
            const mockCrypto = {
                randomUUID: () => 'generated-uuid-123'
            };
            return {
                default: mockCrypto,
                ...mockCrypto
            };
        });
    });

    describe('registerUser', () => {
        const registerInput = {
            email: 'new@example.com',
            password: 'password123',
            firstName: 'New',
            lastName: 'User',
            phone: '1234567890'
        };

        it('should successfully register a new user', async () => {
            // Mocks
            (userRepository.findByEmail as any).mockResolvedValue(null);
            (bcrypt.hash as any).mockResolvedValue('hashed_password');
            (roleRepository.findByName as any).mockResolvedValue({ id: 'role-cashier' });
            (userRepository.create as any).mockResolvedValue({
                id: 'new-user-id',
                ...registerInput,
                status: 'ACTIVE',
                emailVerified: true
            });

            const result = await authService.registerUser(registerInput);

            expect(userRepository.findByEmail).toHaveBeenCalledWith(registerInput.email);
            expect(bcrypt.hash).toHaveBeenCalledWith(registerInput.password, 14);
            expect(userRepository.create).toHaveBeenCalled();
            expect(auditLogRepository.create).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it('should fail if email already exists', async () => {
            (userRepository.findByEmail as any).mockResolvedValue(mockUser);

            const result = await authService.registerUser(registerInput);

            expect(result.success).toBe(false);
            expect(result.message).toBe('Email already registered');
            expect(userRepository.create).not.toHaveBeenCalled();
        });

        it('should throw error if default role not found', async () => {
            (userRepository.findByEmail as any).mockResolvedValue(null);
            (roleRepository.findByName as any).mockResolvedValue(null);

            await expect(authService.registerUser(registerInput))
                .rejects.toThrow('Default system role (Cashier) not found');
        });
    });

    describe('login', () => {
        const loginInput = {
            email: 'test@example.com',
            password: 'password123'
        };

        it('should successfully login with valid credentials', async () => {
            (userRepository.findByEmail as any).mockResolvedValue(mockUser);
            (bcrypt.compare as any).mockResolvedValue(true);
            (jwt.sign as any).mockReturnValue('mock-jwt-token');

            const result = await authService.login(loginInput);

            expect(result.success).toBe(true);
            expect(result.token).toBeDefined();
            expect(result.user).toBeDefined();
            expect(result.permissions).toContain('PRODUCTS:READ');

            expect(sessionRepository.create).toHaveBeenCalled();
            expect(userRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
            expect(auditLogRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                action: 'USER_LOGIN'
            }));
        });

        it('should fail if user not found', async () => {
            (userRepository.findByEmail as any).mockResolvedValue(null);

            const result = await authService.login(loginInput);

            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid email or password');
            expect(auditLogRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                action: 'USER_LOGIN_FAILED'
            }));
        });

        it('should fail if password is valid', async () => {
            (userRepository.findByEmail as any).mockResolvedValue(mockUser);
            (bcrypt.compare as any).mockResolvedValue(false);

            const result = await authService.login(loginInput);

            expect(result.success).toBe(false);
            expect(result.message).toBe('Invalid email or password');
            expect(auditLogRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                action: 'USER_LOGIN_FAILED',
                details: { reason: 'Invalid password' }
            }));
        });

        it('should fail if user is inactive', async () => {
            (userRepository.findByEmail as any).mockResolvedValue({
                ...mockUser,
                status: 'INACTIVE'
            });

            const result = await authService.login(loginInput);

            expect(result.success).toBe(false);
            expect(result.message).toBe('Account is inactive or suspended');
        });

        it('should fail if email is not verified', async () => {
            (userRepository.findByEmail as any).mockResolvedValue({
                ...mockUser,
                emailVerified: false
            });

            const result = await authService.login(loginInput);

            expect(result.success).toBe(false);
            expect(result.message).toBe('Please verify your email before logging in');
        });
    });

    describe('logout', () => {
        it('should delete session and log logout', async () => {
            const token = 'some-token';
            const userId = 'user-123';

            await authService.logout(token, userId);

            expect(sessionRepository.deleteByToken).toHaveBeenCalledWith(token);
            expect(auditLogRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                action: 'USER_LOGOUT',
                userId
            }));
        });
    });

    describe('validateSession', () => {
        it('should return session if valid', async () => {
            const mockSession = {
                token: 'valid-token',
                expiresAt: new Date(Date.now() + 3600000), // +1 hour
                User: { status: 'ACTIVE' }
            };
            (sessionRepository.findByToken as any).mockResolvedValue(mockSession);

            const result = await authService.validateSession('valid-token');

            expect(result).toEqual(mockSession);
        });

        it('should return null if session expired', async () => {
            const mockSession = {
                token: 'expired-token',
                expiresAt: new Date(Date.now() - 3600000), // -1 hour
                User: { status: 'ACTIVE' }
            };
            (sessionRepository.findByToken as any).mockResolvedValue(mockSession);

            const result = await authService.validateSession('expired-token');

            expect(result).toBeNull();
            expect(sessionRepository.deleteByToken).toHaveBeenCalledWith('expired-token');
        });

        it('should return null if user is inactive', async () => {
            const mockSession = {
                token: 'valid-token',
                expiresAt: new Date(Date.now() + 3600000),
                User: { status: 'INACTIVE' }
            };
            (sessionRepository.findByToken as any).mockResolvedValue(mockSession);

            const result = await authService.validateSession('valid-token');

            expect(result).toBeNull();
        });
    });
});
