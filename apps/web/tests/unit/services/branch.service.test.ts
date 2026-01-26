
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { branchService } from '@/services/branch.service';
import { branchRepository } from '@/repositories/branch.repository';
import { ValidationError, NotFoundError } from '@/lib/errors';

// Mock dependencies
vi.mock('@/repositories/branch.repository', () => ({
    branchRepository: {
        findAll: vi.fn(),
        findById: vi.fn(),
        findActive: vi.fn(),
        findByCode: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('BranchService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createBranch', () => {
        it('should create a branch successfully', async () => {
            const input = {
                name: 'Main Branch',
                code: 'MAIN',
                location: '123 St',
                manager: 'Test Manager',
                phone: '1234567890',
            };

            vi.mocked(branchRepository.findByCode).mockResolvedValue(null);
            vi.mocked(branchRepository.create).mockResolvedValue({ id: 'branch-1', ...input, status: 'active', createdAt: new Date(), updatedAt: new Date() });

            const result = await branchService.createBranch(input);

            expect(branchRepository.findByCode).toHaveBeenCalledWith('MAIN');
            expect(branchRepository.create).toHaveBeenCalled();
            expect(result.id).toBe('branch-1');
        });

        it('should throw error if code exists', async () => {
            const input = { name: 'Main', code: 'MAIN', address: '123', phone: '123', isMain: true };
            vi.mocked(branchRepository.findByCode).mockResolvedValue({ id: 'existing' } as any);

            await expect(branchService.createBranch(input)).rejects.toThrow(ValidationError);
        });
    });

    describe('updateBranch', () => {
        it('should update branch successfully', async () => {
            const id = 'branch-1';
            const input = { name: 'New Name' };
            const existing = { id, code: 'MAIN' };

            vi.mocked(branchRepository.findById).mockResolvedValue(existing as any);
            vi.mocked(branchRepository.update).mockResolvedValue({ ...existing, ...input } as any);

            await branchService.updateBranch(id, input);

            expect(branchRepository.update).toHaveBeenCalledWith(id, expect.anything());
        });

        it('should throw if branch not found', async () => {
            vi.mocked(branchRepository.findById).mockResolvedValue(null);
            await expect(branchService.updateBranch('bad-id', {})).rejects.toThrow(NotFoundError);
        });
    });
});
