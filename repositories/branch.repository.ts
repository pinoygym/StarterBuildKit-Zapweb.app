import { prisma } from '@/lib/prisma';
import { Branch } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CreateBranchInput, UpdateBranchInput } from '@/types/branch.types';
import { withErrorHandling } from '@/lib/errors';

export class BranchRepository {
  async findAll(): Promise<Branch[]> {
    return withErrorHandling(async () => {
      return await prisma.branch.findMany({
        orderBy: { name: 'asc' },
      });
    }, 'BranchRepository.findAll');
  }

  async findById(id: string): Promise<Branch | null> {
    return withErrorHandling(async () => {
      return await prisma.branch.findUnique({
        where: { id },
      });
    }, 'BranchRepository.findById');
  }

  async findByCode(code: string): Promise<Branch | null> {
    return withErrorHandling(async () => {
      return await prisma.branch.findUnique({
        where: { code },
      });
    }, 'BranchRepository.findByCode');
  }

  async create(data: CreateBranchInput): Promise<Branch> {
    return withErrorHandling(async () => {
      return await prisma.branch.create({
        data: {
          id: randomUUID(),
          name: data.name,
          code: data.code,
          location: data.location,
          manager: data.manager,
          phone: data.phone,
          status: data.status || 'active',
          updatedAt: new Date(),
        },
      });
    }, 'BranchRepository.create');
  }

  async update(id: string, data: UpdateBranchInput): Promise<Branch> {
    return withErrorHandling(async () => {
      return await prisma.branch.update({
        where: { id },
        data,
      });
    }, 'BranchRepository.update');
  }

  async delete(id: string): Promise<Branch> {
    return withErrorHandling(async () => {
      return await prisma.branch.delete({
        where: { id },
      });
    }, 'BranchRepository.delete');
  }

  async findActive(): Promise<Branch[]> {
    return withErrorHandling(async () => {
      return await prisma.branch.findMany({
        where: { status: 'active' },
        orderBy: { name: 'asc' },
      });
    }, 'BranchRepository.findActive');
  }
}

export const branchRepository = new BranchRepository();
