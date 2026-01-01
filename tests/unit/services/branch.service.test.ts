import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BranchService } from '@/services/branch.service';
import { branchRepository } from '@/repositories/branch.repository';
import { ValidationError, NotFoundError } from '@/lib/errors';

// Mock dependencies
vi.mock('@/repositories/branch.repository', () => ({
  branchRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findActive: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByCode: vi.fn(),
  },
}));

describe('BranchService', () => {
  let branchService: BranchService;

  beforeEach(() => {
    branchService = new BranchService();
    vi.clearAllMocks();
  });

  describe('getAllBranches', () => {
    it('should return all branches', async () => {
      const mockBranches = [{ id: 'branch-1', name: 'Branch 1' }];
      vi.mocked(branchRepository.findAll).mockResolvedValue(mockBranches as any);

      const result = await branchService.getAllBranches();

      expect(result).toEqual(mockBranches);
      expect(branchRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getBranchById', () => {
    it('should return branch by id', async () => {
      const mockBranch = { id: 'branch-1', name: 'Branch 1' };
      vi.mocked(branchRepository.findById).mockResolvedValue(mockBranch as any);

      const result = await branchService.getBranchById('branch-1');

      expect(result).toEqual(mockBranch);
      expect(branchRepository.findById).toHaveBeenCalledWith('branch-1');
    });

    it('should throw NotFoundError if branch not found', async () => {
      vi.mocked(branchRepository.findById).mockResolvedValue(null);

      await expect(branchService.getBranchById('branch-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createBranch', () => {
    const createInput = {
      name: 'New Branch',
      code: 'NB001',
      location: '123 Main St',
      manager: 'John Manager',
      phone: '1234567890',
      status: 'active' as const,
    };

    it('should create a new branch successfully', async () => {
      vi.mocked(branchRepository.findByCode).mockResolvedValue(null);
      vi.mocked(branchRepository.create).mockResolvedValue({ id: 'branch-1', ...createInput } as any);

      const result = await branchService.createBranch(createInput);

      expect(result).toEqual({ id: 'branch-1', ...createInput });
      expect(branchRepository.create).toHaveBeenCalledWith(createInput);
    });

    it('should throw ValidationError if branch code already exists', async () => {
      vi.mocked(branchRepository.findByCode).mockResolvedValue({ id: 'existing' } as any);

      await expect(branchService.createBranch(createInput)).rejects.toThrow(ValidationError);
      expect(branchRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid data', async () => {
        const invalidInput = { ...createInput, phone: 'invalid-phone-!!' };

        await expect(branchService.createBranch(invalidInput)).rejects.toThrow(ValidationError);
        expect(branchRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateBranch', () => {
    const updateInput = {
      name: 'Updated Branch',
      code: 'UB001',
    };
    const existingBranch = { id: 'branch-1', name: 'Branch 1', code: 'B001', status: 'active' };

    it('should update branch successfully', async () => {
      vi.mocked(branchRepository.findById).mockResolvedValue(existingBranch as any);
      vi.mocked(branchRepository.findByCode).mockResolvedValue(null);
      vi.mocked(branchRepository.update).mockResolvedValue({ ...existingBranch, ...updateInput } as any);

      const result = await branchService.updateBranch('branch-1', updateInput);

      expect(result).toEqual({ ...existingBranch, ...updateInput });
      expect(branchRepository.update).toHaveBeenCalledWith('branch-1', updateInput);
    });

    it('should throw NotFoundError if branch not found', async () => {
      vi.mocked(branchRepository.findById).mockResolvedValue(null);

      await expect(branchService.updateBranch('branch-1', updateInput)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if new code already exists', async () => {
      vi.mocked(branchRepository.findById).mockResolvedValue(existingBranch as any);
      vi.mocked(branchRepository.findByCode).mockResolvedValue({ id: 'other-branch' } as any);

      await expect(branchService.updateBranch('branch-1', updateInput)).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch successfully', async () => {
      vi.mocked(branchRepository.findById).mockResolvedValue({ id: 'branch-1' } as any);

      await branchService.deleteBranch('branch-1');

      expect(branchRepository.delete).toHaveBeenCalledWith('branch-1');
    });

    it('should throw NotFoundError if branch not found', async () => {
      vi.mocked(branchRepository.findById).mockResolvedValue(null);

      await expect(branchService.deleteBranch('branch-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('toggleBranchStatus', () => {
    it('should toggle status from active to inactive', async () => {
        const branch = { id: 'branch-1', status: 'active' };
        vi.mocked(branchRepository.findById).mockResolvedValue(branch as any);
        vi.mocked(branchRepository.update).mockResolvedValue({ ...branch, status: 'inactive' } as any);

        const result = await branchService.toggleBranchStatus('branch-1');

        expect(result.status).toBe('inactive');
        expect(branchRepository.update).toHaveBeenCalledWith('branch-1', { status: 'inactive' });
    });

     it('should toggle status from inactive to active', async () => {
        const branch = { id: 'branch-1', status: 'inactive' };
        vi.mocked(branchRepository.findById).mockResolvedValue(branch as any);
        vi.mocked(branchRepository.update).mockResolvedValue({ ...branch, status: 'active' } as any);

        const result = await branchService.toggleBranchStatus('branch-1');

        expect(result.status).toBe('active');
        expect(branchRepository.update).toHaveBeenCalledWith('branch-1', { status: 'active' });
    });
  });
});
