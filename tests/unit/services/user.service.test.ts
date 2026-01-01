import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '@/services/user.service';
import { userRepository } from '@/repositories/user.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('@/repositories/user.repository', () => ({
  userRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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
  },
}));

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 'role-1',
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as any);
      vi.mocked(userRepository.create).mockResolvedValue({ id: 'user-1', ...input } as any);

      const result = await service.createUser(input as any, 'admin-id');

      expect(userRepository.create).toHaveBeenCalled();
      expect(auditLogRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if email exists', async () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue({ id: 'existing' } as any);

      await expect(service.createUser(input as any, 'admin-id')).rejects.toThrow('Email already exists');
    });
  });
});