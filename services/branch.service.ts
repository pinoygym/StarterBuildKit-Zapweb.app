import { Branch } from '@prisma/client';
import { branchRepository } from '@/repositories/branch.repository';
import { CreateBranchInput, UpdateBranchInput } from '@/types/branch.types';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { branchSchema, updateBranchSchema } from '@/lib/validations/branch.validation';

export class BranchService {
  async getAllBranches(): Promise<Branch[]> {
    return await branchRepository.findAll();
  }

  async getBranchById(id: string): Promise<Branch> {
    const branch = await branchRepository.findById(id);
    if (!branch) {
      throw new NotFoundError('Branch');
    }
    return branch;
  }

  async getActiveBranches(): Promise<Branch[]> {
    return await branchRepository.findActive();
  }

  async createBranch(data: CreateBranchInput): Promise<Branch> {
    // Validate input
    const validationResult = branchSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid branch data', errors as Record<string, string>);
    }

    // Check if branch code already exists
    const existingBranch = await branchRepository.findByCode(data.code);
    if (existingBranch) {
      throw new ValidationError('Branch code already exists', { code: 'Branch code must be unique' });
    }

    return await branchRepository.create(validationResult.data);
  }

  async updateBranch(id: string, data: UpdateBranchInput): Promise<Branch> {
    // Check if branch exists
    const existingBranch = await branchRepository.findById(id);
    if (!existingBranch) {
      throw new NotFoundError('Branch');
    }

    // Validate input
    const validationResult = updateBranchSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid branch data', errors as Record<string, string>);
    }

    // Check if branch code is being updated and if it already exists
    if (data.code && data.code !== existingBranch.code) {
      const branchWithCode = await branchRepository.findByCode(data.code);
      if (branchWithCode) {
        throw new ValidationError('Branch code already exists', { code: 'Branch code must be unique' });
      }
    }

    return await branchRepository.update(id, validationResult.data);
  }

  async deleteBranch(id: string): Promise<void> {
    // Check if branch exists
    const branch = await branchRepository.findById(id);
    if (!branch) {
      throw new NotFoundError('Branch');
    }

    // Note: In a production system, you might want to check for related records
    // and prevent deletion if there are warehouses, orders, etc. linked to this branch
    // For now, we'll allow deletion (Prisma will handle cascade rules)

    await branchRepository.delete(id);
  }

  async toggleBranchStatus(id: string): Promise<Branch> {
    const branch = await this.getBranchById(id);
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';
    return await this.updateBranch(id, { status: newStatus });
  }
}

export const branchService = new BranchService();
