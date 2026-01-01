import { prisma } from '@/lib/prisma';
import { Branch } from '@prisma/client';
import { CreateBranchInput, UpdateBranchInput } from '@/types/branch.types';

export class BranchRepository {
  async findAll(): Promise<Branch[]> {
    return await prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Branch | null> {
    return await prisma.branch.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<Branch | null> {
    return await prisma.branch.findUnique({
      where: { code },
    });
  }

  async create(data: CreateBranchInput): Promise<Branch> {
    return await prisma.branch.create({
      data: {
        name: data.name,
        code: data.code,
        location: data.location,
        manager: data.manager,
        phone: data.phone,
        status: data.status || 'active',
      },
    });
  }

  async update(id: string, data: UpdateBranchInput): Promise<Branch> {
    return await prisma.branch.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Branch> {
    return await prisma.branch.delete({
      where: { id },
    });
  }

  async findActive(): Promise<Branch[]> {
    return await prisma.branch.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });
  }
}

export const branchRepository = new BranchRepository();
