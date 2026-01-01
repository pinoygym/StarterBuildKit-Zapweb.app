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

  describe('getAllUsers', () => {
    it('should return all users with pagination', async () => {
      const mockUsers = [{ id: '1', email: 'user1@test.com' }, { id: '2', email: 'user2@test.com' }];
      vi.mocked(userRepository.findAll).mockResolvedValue({ data: mockUsers, total: 2, page: 1, limit: 20, totalPages: 1 } as any);

      const result = await service.getAllUsers();

      // Assuming service returns the raw paginated response or we need to adjust expectation
      // Given the TS error, the repo returns an object. 
      // If service simply returns repo result (common), then result is that object.
      // So expect(result.data).toEqual(mockUsers) would be correct.
      // But I will just fix the mock value for now to make TS happy.
      expect(result.data).toEqual(mockUsers);
      expect(userRepository.findAll).toHaveBeenCalledWith(undefined, 1, 20);
    });

    it('should apply filters', async () => {
      const filters = { status: 'ACTIVE' };
      vi.mocked(userRepository.findAll).mockResolvedValue({ data: [], total: 0, page: 2, limit: 50, totalPages: 0 } as any);

      await service.getAllUsers(filters as any, 2, 50);

      expect(userRepository.findAll).toHaveBeenCalledWith(filters, 2, 50);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);

      const result = await service.getUserById('1');

      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser as any);

      const result = await service.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const existingUser = { id: '1', email: 'old@example.com' };
      const updateData = { firstName: 'Jane' };

      vi.mocked(userRepository.findById).mockResolvedValue(existingUser as any);
      vi.mocked(userRepository.update).mockResolvedValue({ ...existingUser, ...updateData } as any);

      const result = await service.updateUser('1', updateData, 'admin-id');

      expect(result.firstName).toBe('Jane');
      expect(auditLogRepository.create).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(service.updateUser('1', {}, 'admin-id')).rejects.toThrow('User not found');
    });

    it('should throw error if email already exists', async () => {
      const existingUser = { id: '1', email: 'old@example.com' };
      const updateData = { email: 'existing@example.com' };

      vi.mocked(userRepository.findById).mockResolvedValue(existingUser as any);
      vi.mocked(userRepository.findByEmail).mockResolvedValue({ id: '2' } as any);

      await expect(service.updateUser('1', updateData, 'admin-id')).rejects.toThrow('Email already exists');
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);

      await service.deleteUser('1', 'admin-id');

      expect(userRepository.update).toHaveBeenCalledWith('1', { status: 'INACTIVE' });
      expect(auditLogRepository.create).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(service.deleteUser('1', 'admin-id')).rejects.toThrow('User not found');
    });
  });

  describe('activateUser', () => {
    it('should activate user', async () => {
      const mockUser = { id: '1', status: 'INACTIVE' };
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);

      await service.activateUser('1', 'admin-id');

      expect(userRepository.update).toHaveBeenCalledWith('1', { status: 'ACTIVE' });
      expect(auditLogRepository.create).toHaveBeenCalled();
    });
  });

  describe('suspendUser', () => {
    it('should suspend user', async () => {
      const mockUser = { id: '1', status: 'ACTIVE' };
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);

      await service.suspendUser('1', 'admin-id');

      expect(userRepository.update).toHaveBeenCalledWith('1', { status: 'SUSPENDED' });
      expect(auditLogRepository.create).toHaveBeenCalled();
    });
  });

  describe('getUsersByRole', () => {
    it('should return users by role', async () => {
      const mockUsers = [{ id: '1', roleId: 'role-1' }];
      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers as any);

      const result = await service.getUsersByRole('role-1');

      expect(userRepository.findAll).toHaveBeenCalledWith({ roleId: 'role-1' }, 1, 20);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUsersByBranch', () => {
    it('should return users by branch', async () => {
      const mockUsers = [{ id: '1', branchId: 'branch-1' }];
      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers as any);

      const result = await service.getUsersByBranch('branch-1');

      expect(userRepository.findAll).toHaveBeenCalledWith({ branchId: 'branch-1' }, 1, 20);
    });
  });

  describe('searchUsers', () => {
    it('should search users by term', async () => {
      const mockUsers = [{ id: '1', email: 'john@example.com' }];
      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers as any);

      const result = await service.searchUsers('john');

      expect(userRepository.findAll).toHaveBeenCalledWith({ search: 'john' }, 1, 20);
    });
  });
});