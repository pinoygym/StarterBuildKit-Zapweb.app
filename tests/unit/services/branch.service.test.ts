import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BranchService } from '@/services/branch.service';
import { branchRepository } from '@/repositories/branch.repository';
import { DatabaseTestBase, TestUtils } from '@/tests/helpers/test-base';
import { ValidationError, NotFoundError } from '@/lib/errors';

// Mock repository
vi.mock('@/repositories/branch.repository');

describe('BranchService', () => {
  let branchService: BranchService;
  let dbTestBase: DatabaseTestBase;
  let testBranchId: string;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Initialize database test base
    dbTestBase = new DatabaseTestBase();
    await dbTestBase.setup();

    // Create test branch ID
    testBranchId = TestUtils.generate.id();

    // Initialize service
    branchService = new BranchService();
  });

  afterEach(async () => {
    await dbTestBase.teardown();
  });

  describe('getAllBranches', () => {
    it('should return all branches', async () => {
      const mockBranches = [
        TestUtils.generate.branch(),
        TestUtils.generate.branch(),
      ];

      const mockFindAll = vi.mocked(branchRepository.findAll);
      mockFindAll.mockResolvedValue(mockBranches);

      const result = await branchService.getAllBranches();

      expect(mockFindAll).toHaveBeenCalled();
      expect(result).toEqual(mockBranches);
    });

    it('should return empty array when no branches exist', async () => {
      const mockFindAll = vi.mocked(branchRepository.findAll);
      mockFindAll.mockResolvedValue([]);

      const result = await branchService.getAllBranches();

      expect(result).toHaveLength(0);
    });
  });

  describe('getBranchById', () => {
    it('should return branch when found', async () => {
      const mockBranch = TestUtils.generate.branch();

      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockResolvedValue(mockBranch);

      const result = await branchService.getBranchById(testBranchId);

      expect(mockFindById).toHaveBeenCalledWith(testBranchId);
      expect(result).toEqual(mockBranch);
    });

    it('should throw NotFoundError when branch not found', async () => {
      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        branchService.getBranchById('non-existent-id')
      ).rejects.toThrow(NotFoundError);

      expect(mockFindById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('getActiveBranches', () => {
    it('should return only active branches', async () => {
      const mockBranches = [
        TestUtils.generate.branch({ status: 'active' }),
        TestUtils.generate.branch({ status: 'active' }),
      ];

      const mockFindActive = vi.mocked(branchRepository.findActive);
      mockFindActive.mockResolvedValue(mockBranches);

      const result = await branchService.getActiveBranches();

      expect(mockFindActive).toHaveBeenCalled();
      expect(result).toEqual(mockBranches);
      expect(result.every(branch => branch.status === 'active')).toBe(true);
    });
  });

  describe('createBranch', () => {
    const validBranchData = {
      name: 'Test Branch',
      code: 'TB001',
      location: 'Test Location',
      phone: '+1234567890',
      manager: 'John Doe',
    };

    it('should create branch successfully', async () => {
      const mockBranch = {
        ...validBranchData,
        id: testBranchId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFindByCode = vi.mocked(branchRepository.findByCode);
      mockFindByCode.mockResolvedValue(null);

      const mockCreate = vi.mocked(branchRepository.create);
      mockCreate.mockResolvedValue(mockBranch);

      const result = await branchService.createBranch(validBranchData);

      expect(mockFindByCode).toHaveBeenCalledWith(validBranchData.code);
      expect(mockCreate).toHaveBeenCalled();
      expect(result).toEqual(mockBranch);
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        code: 'INVALID CODE WITH SPACES', // Invalid: spaces in code
        location: 'Test Location',
      };

      await expect(
        branchService.createBranch(invalidData as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when branch code already exists', async () => {
      const mockFindByCode = vi.mocked(branchRepository.findByCode);
      mockFindByCode.mockResolvedValue({} as any);

      await expect(
        branchService.createBranch(validBranchData)
      ).rejects.toThrow(ValidationError);

      expect(mockFindByCode).toHaveBeenCalledWith(validBranchData.code);
    });
  });

  describe('updateBranch', () => {
    const updateData = {
      name: 'Updated Branch Name',
      location: 'Updated Location',
      phone: '+1987654321',
      manager: 'Jane Smith',
    };

    it('should update branch successfully', async () => {
      const existingBranch = {
        id: testBranchId,
        name: 'Original Name',
        code: 'TB001',
        location: 'Original Location',
        phone: '+1234567890',
        manager: 'John Doe',
        status: 'active',
      };

      const updatedBranch = {
        ...existingBranch,
        ...updateData,
        updatedAt: new Date(),
      };

      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockResolvedValue(existingBranch as any);

      const mockFindByCode = vi.mocked(branchRepository.findByCode);
      mockFindByCode.mockResolvedValue(null);

      const mockUpdate = vi.mocked(branchRepository.update);
      mockUpdate.mockResolvedValue(updatedBranch as any);

      const result = await branchService.updateBranch(testBranchId, updateData);

      expect(mockFindById).toHaveBeenCalledWith(testBranchId);
      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toEqual(updatedBranch);
    });

    it('should throw NotFoundError when branch not found', async () => {
      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        branchService.updateBranch('non-existent-id', updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid update data', async () => {
      const existingBranch = {
        id: testBranchId,
        name: 'Original Name',
        code: 'TB001',
        location: 'Original Location',
      };

      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockResolvedValue(existingBranch as any);

      const invalidData = {
        code: 'INVALID CODE', // Invalid: spaces in code
      };

      await expect(
        branchService.updateBranch(testBranchId, invalidData as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when updating to existing branch code', async () => {
      const existingBranch = {
        id: testBranchId,
        name: 'Original Name',
        code: 'TB001',
        location: 'Original Location',
      };

      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockResolvedValue(existingBranch as any);

      const mockFindByCode = vi.mocked(branchRepository.findByCode);
      mockFindByCode.mockResolvedValue({} as any);

      const updateWithExistingCode = {
        ...updateData,
        code: 'EXISTING_CODE',
      };

      await expect(
        branchService.updateBranch(testBranchId, updateWithExistingCode)
      ).rejects.toThrow(ValidationError);
    });

    it('should allow updating to same branch code', async () => {
      const existingBranch = {
        id: testBranchId,
        name: 'Original Name',
        code: 'TB001',
        location: 'Original Location',
      };

      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockResolvedValue(existingBranch as any);

      const mockFindByCode = vi.mocked(branchRepository.findByCode);
      mockFindByCode.mockResolvedValue(null); // No conflict since it's the same branch

      const mockUpdate = vi.mocked(branchRepository.update);
      mockUpdate.mockResolvedValue({ ...existingBranch, ...updateData } as any);

      const updateWithSameCode = {
        ...updateData,
        code: 'TB001', // Same as existing
      };

      const result = await branchService.updateBranch(testBranchId, updateWithSameCode);

      expect(mockUpdate).toHaveBeenCalled();
      expect(result.code).toBe('TB001');
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch successfully', async () => {
      const existingBranch = {
        id: testBranchId,
        name: 'Test Branch',
        code: 'TB001',
        location: 'Test Location',
      };

      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockResolvedValue(existingBranch as any);

      const mockDelete = vi.mocked(branchRepository.delete);
      mockDelete.mockResolvedValue(undefined);

      await branchService.deleteBranch(testBranchId);

      expect(mockFindById).toHaveBeenCalledWith(testBranchId);
      expect(mockDelete).toHaveBeenCalledWith(testBranchId);
    });

    it('should throw NotFoundError when branch not found', async () => {
      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        branchService.deleteBranch('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('toggleBranchStatus', () => {
    it('should activate inactive branch', async () => {
      const inactiveBranch = {
        id: testBranchId,
        name: 'Inactive Branch',
        code: 'IB001',
        status: 'inactive',
      };

      const activatedBranch = {
        ...inactiveBranch,
        status: 'active',
      };

      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockResolvedValue(inactiveBranch as any);

      const mockUpdate = vi.mocked(branchRepository.update);
      mockUpdate.mockResolvedValue(activatedBranch as any);

      const result = await branchService.toggleBranchStatus(testBranchId);

      expect(mockUpdate).toHaveBeenCalledWith(testBranchId, { status: 'active' });
      expect(result.status).toBe('active');
    });

    it('should deactivate active branch', async () => {
      const activeBranch = {
        id: testBranchId,
        name: 'Active Branch',
        code: 'AB001',
        status: 'active',
      };

      const deactivatedBranch = {
        ...activeBranch,
        status: 'inactive',
      };

      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockResolvedValue(activeBranch as any);

      const mockUpdate = vi.mocked(branchRepository.update);
      mockUpdate.mockResolvedValue(deactivatedBranch as any);

      const result = await branchService.toggleBranchStatus(testBranchId);

      expect(mockUpdate).toHaveBeenCalledWith(testBranchId, { status: 'inactive' });
      expect(result.status).toBe('inactive');
    });

    it('should throw NotFoundError when branch not found', async () => {
      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        branchService.toggleBranchStatus('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Multi-tenancy Critical Scenarios', () => {
    it('should handle branch isolation correctly', async () => {
      // Test that branches are properly isolated
      const branch1 = TestUtils.generate.branch({ id: 'branch-1', code: 'BR001' });
      const branch2 = TestUtils.generate.branch({ id: 'branch-2', code: 'BR002' });

      const mockFindById = vi.mocked(branchRepository.findById);
      mockFindById.mockImplementation((id) => {
        if (id === 'branch-1') return Promise.resolve(branch1);
        if (id === 'branch-2') return Promise.resolve(branch2);
        return Promise.resolve(null);
      });

      const result1 = await branchService.getBranchById('branch-1');
      const result2 = await branchService.getBranchById('branch-2');

      expect(result1.code).toBe('BR001');
      expect(result2.code).toBe('BR002');
      expect(result1.id).not.toBe(result2.id);
    });

    it('should prevent duplicate branch codes across tenants', async () => {
      const mockFindByCode = vi.mocked(branchRepository.findByCode);
      mockFindByCode.mockResolvedValue({
        id: 'existing-branch',
        code: 'DUPLICATE',
        name: 'Existing Branch',
      } as any);

      await expect(
        branchService.createBranch({
          name: 'New Branch',
          code: 'DUPLICATE', // Same code as existing
          location: 'New Location',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should validate branch code format', async () => {
      // Test various invalid code formats
      const invalidCodes = [
        'CODE WITH SPACES',
        'code-with-dashes', // Should be uppercase
        'CodeWithMixedCase',
        '123STARTSWITHNUMBER',
        'CODE!', // Special characters
      ];

      for (const invalidCode of invalidCodes) {
        await expect(
          branchService.createBranch({
            name: 'Test Branch',
            code: invalidCode,
            location: 'Test Location',
          })
        ).rejects.toThrow(ValidationError);
      }
    });

    it('should handle concurrent branch operations', async () => {
      // Test that multiple branch operations can run concurrently
      const branches = Array.from({ length: 5 }, () => TestUtils.generate.branch());

      const mockFindAll = vi.mocked(branchRepository.findAll);
      mockFindAll.mockResolvedValue(branches);

      const mockFindActive = vi.mocked(branchRepository.findActive);
      mockFindActive.mockResolvedValue(branches.filter(b => b.status === 'active'));

      const [allBranches, activeBranches] = await Promise.all([
        branchService.getAllBranches(),
        branchService.getActiveBranches(),
      ]);

      expect(allBranches).toHaveLength(5);
      expect(activeBranches.length).toBeLessThanOrEqual(5);
    });
  });
});