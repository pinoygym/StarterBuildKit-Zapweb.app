import { describe, it, expect, vi, beforeEach } from 'vitest';
import { branchService } from '@/services/branch.service';
import { branchRepository } from '@/repositories/branch.repository';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors';

// Mock dependencies
vi.mock('@/repositories/branch.repository', () => ({
  branchRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByCode: vi.fn(),
    findActive: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('BranchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllBranches', () => {
    it('should return all branches', async () => {
      const mockBranches = [
        { id: '1', name: 'Branch 1', code: 'B1', status: 'active' },
        { id: '2', name: 'Branch 2', code: 'B2', status: 'active' },
      ];

      vi.mocked(branchRepository.findAll).mockResolvedValue(mockBranches as any);

      const result = await branchService.getAllBranches();

      expect(result).toEqual(mockBranches);
      expect(branchRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBranchById', () => {
    it('should return branch if found', async () => {
      const mockBranch = { id: '1', name: 'Branch 1', code: 'B1', status: 'active' };
      vi.mocked(branchRepository.findById).mockResolvedValue(mockBranch as any);

      const result = await branchService.getBranchById('1');

      expect(result).toEqual(mockBranch);
      expect(branchRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundError if branch not found', async () => {
      vi.mocked(branchRepository.findById).mockResolvedValue(null);

      await expect(branchService.getBranchById('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getActiveBranches', () => {
    it('should return only active branches', async () => {
      const mockActiveBranches = [
        { id: '1', name: 'Branch 1', code: 'B1', status: 'active' },
      ];

      vi.mocked(branchRepository.findActive).mockResolvedValue(mockActiveBranches as any);

      const result = await branchService.getActiveBranches();

      expect(result).toEqual(mockActiveBranches);
      expect(branchRepository.findActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('createBranch', () => {
    const validInput = {
      name: 'Test Branch',
      code: 'TB1',
      location: 'Test Location',
      manager: 'Test Manager',
      phone: '1234567890',
    };

    it('should create a branch successfully', async () => {
      vi.mocked(branchRepository.findByCode).mockResolvedValue(null);
      vi.mocked(branchRepository.create).mockResolvedValue({
        id: 'branch-1',
        ...validInput,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await branchService.createBranch(validInput);

      expect(branchRepository.findByCode).toHaveBeenCalledWith(validInput.code);
      expect(branchRepository.create).toHaveBeenCalledWith(expect.objectContaining(validInput));
      expect(result.id).toBe('branch-1');
      expect(result.name).toBe(validInput.name);
    });

    it('should throw ValidationError if code already exists', async () => {
      vi.mocked(branchRepository.findByCode).mockResolvedValue({
        id: 'existing',
        code: validInput.code,
      } as any);

      await expect(branchService.createBranch(validInput)).rejects.toThrow(ValidationError);
      expect(branchRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidInput = {
        name: '',
        code: '',
        location: '',
        manager: '',
        phone: '',
      };

      await expect(branchService.createBranch(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if name is missing', async () => {
      const invalidInput = {
        ...validInput,
        name: '',
      };

      await expect(branchService.createBranch(invalidInput)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if code is missing', async () => {
      const invalidInput = {
        ...validInput,
        code: '',
      };

      await expect(branchService.createBranch(invalidInput)).rejects.toThrow(ValidationError);
    });
  });

  describe('updateBranch', () => {
    const updateInput = {
      name: 'Updated Branch Name',
      location: 'Updated Location',
    };

    it('should update a branch successfully', async () => {
      const existingBranch = {
        id: 'branch-1',
        name: 'Old Name',
        code: 'B1',
        location: 'Old Location',
        status: 'active',
      };

      vi.mocked(branchRepository.findById).mockResolvedValue(existingBranch as any);
      vi.mocked(branchRepository.update).mockResolvedValue({
        ...existingBranch,
        ...updateInput,
      } as any);

      const result = await branchService.updateBranch('branch-1', updateInput);

      expect(branchRepository.findById).toHaveBeenCalledWith('branch-1');
      expect(branchRepository.update).toHaveBeenCalledWith('branch-1', expect.objectContaining(updateInput));
      expect(result.name).toBe(updateInput.name);
      expect(result.location).toBe(updateInput.location);
    });

    it('should throw NotFoundError if branch does not exist', async () => {
      vi.mocked(branchRepository.findById).mockResolvedValue(null);

      await expect(branchService.updateBranch('non-existent', updateInput)).rejects.toThrow(NotFoundError);
      expect(branchRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if code already exists (when updating code)', async () => {
      const existingBranch = {
        id: 'branch-1',
        name: 'Branch 1',
        code: 'B1',
        status: 'active',
      };

      const updateWithCode = {
        code: 'B2',
      };

      vi.mocked(branchRepository.findById).mockResolvedValue(existingBranch as any);
      vi.mocked(branchRepository.findByCode).mockResolvedValue({
        id: 'other-branch',
        code: 'B2',
      } as any);

      await expect(branchService.updateBranch('branch-1', updateWithCode)).rejects.toThrow(ValidationError);
      expect(branchRepository.update).not.toHaveBeenCalled();
    });

    it('should allow updating code to same value', async () => {
      const existingBranch = {
        id: 'branch-1',
        name: 'Branch 1',
        code: 'B1',
        status: 'active',
      };

      const updateWithSameCode = {
        code: 'B1',
        name: 'Updated Name',
      };

      vi.mocked(branchRepository.findById).mockResolvedValue(existingBranch as any);
      vi.mocked(branchRepository.findByCode).mockResolvedValue(existingBranch as any);
      vi.mocked(branchRepository.update).mockResolvedValue({
        ...existingBranch,
        ...updateWithSameCode,
      } as any);

      const result = await branchService.updateBranch('branch-1', updateWithSameCode);

      expect(result.name).toBe('Updated Name');
      expect(branchRepository.update).toHaveBeenCalled();
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch successfully', async () => {
      const branch = {
        id: 'branch-1',
        name: 'Branch 1',
        code: 'B1',
        status: 'active',
      };

      vi.mocked(branchRepository.findById).mockResolvedValue(branch as any);
      vi.mocked(branchRepository.delete).mockResolvedValue(branch as any);

      await branchService.deleteBranch('branch-1');

      expect(branchRepository.findById).toHaveBeenCalledWith('branch-1');
      expect(branchRepository.delete).toHaveBeenCalledWith('branch-1');
    });

    it('should throw NotFoundError if branch does not exist', async () => {
      vi.mocked(branchRepository.findById).mockResolvedValue(null);

      await expect(branchService.deleteBranch('non-existent')).rejects.toThrow(NotFoundError);
      expect(branchRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('toggleBranchStatus', () => {
    it('should toggle status from active to inactive', async () => {
      const activeBranch = {
        id: 'branch-1',
        name: 'Branch 1',
        code: 'B1',
        status: 'active' as const,
      };

      const inactiveBranch = {
        ...activeBranch,
        status: 'inactive' as const,
      };

      vi.mocked(branchRepository.findById).mockResolvedValue(activeBranch as any);
      vi.mocked(branchRepository.update).mockResolvedValue(inactiveBranch as any);

      const result = await branchService.toggleBranchStatus('branch-1');

      expect(result.status).toBe('inactive');
      expect(branchRepository.update).toHaveBeenCalledWith('branch-1', { status: 'inactive' });
    });

    it('should toggle status from inactive to active', async () => {
      const inactiveBranch = {
        id: 'branch-1',
        name: 'Branch 1',
        code: 'B1',
        status: 'inactive' as const,
      };

      const activeBranch = {
        ...inactiveBranch,
        status: 'active' as const,
      };

      vi.mocked(branchRepository.findById).mockResolvedValue(inactiveBranch as any);
      vi.mocked(branchRepository.update).mockResolvedValue(activeBranch as any);

      const result = await branchService.toggleBranchStatus('branch-1');

      expect(result.status).toBe('active');
      expect(branchRepository.update).toHaveBeenCalledWith('branch-1', { status: 'active' });
    });

    it('should throw NotFoundError if branch does not exist', async () => {
      vi.mocked(branchRepository.findById).mockResolvedValue(null);

      await expect(branchService.toggleBranchStatus('non-existent')).rejects.toThrow(NotFoundError);
    });
  });
});
