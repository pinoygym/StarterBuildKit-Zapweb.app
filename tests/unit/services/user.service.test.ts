import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '@/services/user.service';
import { userRepository } from '@/repositories/user.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { DatabaseTestBase, TestUtils } from '@/tests/helpers/test-base';
import { createTestUser, createTestBranch } from '@/tests/helpers/test-db-utils';

// Mock repositories
vi.mock('@/repositories/user.repository');
vi.mock('@/repositories/audit-log.repository');

describe('UserService', () => {
  let userService: UserService;
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

    const user = await createTestUser({ branchId: testBranchId });
    testUserId = user.id;

    // Initialize service
    userService = new UserService();
  });

  afterEach(async () => {
    await dbTestBase.teardown();
  });

  describe('getAllUsers', () => {
    it('should return paginated users with filters', async () => {
      const mockUsers = {
        users: [TestUtils.generate.user()],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      const mockFindAll = vi.mocked(userRepository.findAll);
      mockFindAll.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers({ status: 'ACTIVE' }, 1, 20);

      expect(mockFindAll).toHaveBeenCalledWith({ status: 'ACTIVE' }, 1, 20);
      expect(result).toEqual(mockUsers);
    });

    it('should handle empty results', async () => {
      const mockUsers = {
        users: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      const mockFindAll = vi.mocked(userRepository.findAll);
      mockFindAll.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers({}, 1, 20);

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = TestUtils.generate.user();
      const mockFindById = vi.mocked(userRepository.findById);
      mockFindById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(testUserId);

      expect(mockFindById).toHaveBeenCalledWith(testUserId);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const mockFindById = vi.mocked(userRepository.findById);
      mockFindById.mockResolvedValue(null);

      const result = await userService.getUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = TestUtils.generate.user();
      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail('test@example.com');

      expect(mockFindByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(null);

      const result = await userService.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    const createUserData = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      roleId: 'role-id',
      branchId: testBranchId,
    };

    it('should create user successfully', async () => {
      const mockUser = {
        id: TestUtils.generate.id(),
        ...createUserData,
        passwordHash: 'hashed-password',
        status: 'ACTIVE',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(null);

      const mockCreate = vi.mocked(userRepository.create);
      mockCreate.mockResolvedValue(mockUser);

      const mockAuditCreate = vi.mocked(auditLogRepository.create);
      mockAuditCreate.mockResolvedValue({} as any);

      const result = await userService.createUser(createUserData, testUserId);

      expect(mockFindByEmail).toHaveBeenCalledWith(createUserData.email);
      expect(mockCreate).toHaveBeenCalled();
      expect(mockAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          action: 'USER_CREATED',
          resource: 'USER',
          resourceId: mockUser.id,
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw error when email already exists', async () => {
      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue({} as any);

      await expect(
        userService.createUser(createUserData, testUserId)
      ).rejects.toThrow('Email already exists');

      expect(mockFindByEmail).toHaveBeenCalledWith(createUserData.email);
    });
  });

  describe('updateUser', () => {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1987654321',
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      const existingUser = {
        id: testUserId,
        email: 'old@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        status: 'ACTIVE',
        emailVerified: true,
      };

      const updatedUser = {
        ...existingUser,
        ...updateData,
      };

      const mockFindById = vi.mocked(userRepository.findById);
      mockFindById.mockResolvedValue(existingUser as any);

      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue(null);

      const mockUpdate = vi.mocked(userRepository.update);
      mockUpdate.mockResolvedValue(updatedUser as any);

      const mockAuditCreate = vi.mocked(auditLogRepository.create);
      mockAuditCreate.mockResolvedValue({} as any);

      const result = await userService.updateUser(testUserId, updateData, testUserId);

      expect(mockFindById).toHaveBeenCalledWith(testUserId);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          action: 'USER_UPDATED',
          resource: 'USER',
          resourceId: testUserId,
        })
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw error when user not found', async () => {
      const mockFindById = vi.mocked(userRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        userService.updateUser('non-existent-id', updateData, testUserId)
      ).rejects.toThrow('User not found');
    });

    it('should throw error when email already exists', async () => {
      const existingUser = {
        id: testUserId,
        email: 'old@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockFindById = vi.mocked(userRepository.findById);
      mockFindById.mockResolvedValue(existingUser as any);

      const mockFindByEmail = vi.mocked(userRepository.findByEmail);
      mockFindByEmail.mockResolvedValue({} as any);

      await expect(
        userService.updateUser(testUserId, updateData, testUserId)
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user successfully', async () => {
      const existingUser = {
        id: testUserId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockFindById = vi.mocked(userRepository.findById);
      mockFindById.mockResolvedValue(existingUser as any);

      const mockUpdate = vi.mocked(userRepository.update);
      mockUpdate.mockResolvedValue({ ...existingUser, status: 'INACTIVE' } as any);

      const mockAuditCreate = vi.mocked(auditLogRepository.create);
      mockAuditCreate.mockResolvedValue({} as any);

      await userService.deleteUser(testUserId, testUserId);

      expect(mockFindById).toHaveBeenCalledWith(testUserId);
      expect(mockUpdate).toHaveBeenCalledWith(testUserId, { status: 'INACTIVE' });
      expect(mockAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          action: 'USER_DELETED',
          resource: 'USER',
          resourceId: testUserId,
        })
      );
    });

    it('should throw error when user not found', async () => {
      const mockFindById = vi.mocked(userRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        userService.deleteUser('non-existent-id', testUserId)
      ).rejects.toThrow('User not found');
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const existingUser = {
        id: testUserId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'INACTIVE',
      };

      const mockFindById = vi.mocked(userRepository.findById);
      mockFindById.mockResolvedValue(existingUser as any);

      const mockUpdate = vi.mocked(userRepository.update);
      mockUpdate.mockResolvedValue({ ...existingUser, status: 'ACTIVE' } as any);

      const mockAuditCreate = vi.mocked(auditLogRepository.create);
      mockAuditCreate.mockResolvedValue({} as any);

      await userService.activateUser(testUserId, testUserId);

      expect(mockUpdate).toHaveBeenCalledWith(testUserId, { status: 'ACTIVE' });
      expect(mockAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_UPDATED',
          details: { status: 'ACTIVE' },
        })
      );
    });
  });

  describe('suspendUser', () => {
    it('should suspend user successfully', async () => {
      const existingUser = {
        id: testUserId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'ACTIVE',
      };

      const mockFindById = vi.mocked(userRepository.findById);
      mockFindById.mockResolvedValue(existingUser as any);

      const mockUpdate = vi.mocked(userRepository.update);
      mockUpdate.mockResolvedValue({ ...existingUser, status: 'SUSPENDED' } as any);

      const mockAuditCreate = vi.mocked(auditLogRepository.create);
      mockAuditCreate.mockResolvedValue({} as any);

      await userService.suspendUser(testUserId, testUserId);

      expect(mockUpdate).toHaveBeenCalledWith(testUserId, { status: 'SUSPENDED' });
      expect(mockAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_UPDATED',
          details: { status: 'SUSPENDED' },
        })
      );
    });
  });

  describe('getUsersByRole', () => {
    it('should return users filtered by role', async () => {
      const mockUsers = {
        users: [TestUtils.generate.user()],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      const mockFindAll = vi.mocked(userRepository.findAll);
      mockFindAll.mockResolvedValue(mockUsers);

      const result = await userService.getUsersByRole('role-id', 1, 20);

      expect(mockFindAll).toHaveBeenCalledWith({ roleId: 'role-id' }, 1, 20);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUsersByBranch', () => {
    it('should return users filtered by branch', async () => {
      const mockUsers = {
        users: [TestUtils.generate.user()],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      const mockFindAll = vi.mocked(userRepository.findAll);
      mockFindAll.mockResolvedValue(mockUsers);

      const result = await userService.getUsersByBranch(testBranchId, 1, 20);

      expect(mockFindAll).toHaveBeenCalledWith({ branchId: testBranchId }, 1, 20);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('searchUsers', () => {
    it('should return users matching search term', async () => {
      const mockUsers = {
        users: [TestUtils.generate.user()],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      const mockFindAll = vi.mocked(userRepository.findAll);
      mockFindAll.mockResolvedValue(mockUsers);

      const result = await userService.searchUsers('john', 1, 20);

      expect(mockFindAll).toHaveBeenCalledWith({ search: 'john' }, 1, 20);
      expect(result).toEqual(mockUsers);
    });
  });
});