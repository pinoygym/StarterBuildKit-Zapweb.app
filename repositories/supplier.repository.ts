import { prisma } from '@/lib/prisma';
import { Supplier } from '@prisma/client';
import { CreateSupplierInput, UpdateSupplierInput, SupplierFilters } from '@/types/supplier.types';

export class SupplierRepository {
  async findAll(filters?: SupplierFilters): Promise<Supplier[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.companyName = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    return await prisma.supplier.findMany({
      where,
      orderBy: { companyName: 'asc' },
    });
  }

  async findById(id: string): Promise<Supplier | null> {
    return await prisma.supplier.findUnique({
      where: { id },
    });
  }

  async findByCompanyName(companyName: string): Promise<Supplier | null> {
    return await prisma.supplier.findFirst({
      where: { 
        companyName: {
          equals: companyName,
          mode: 'insensitive',
        }
      },
    });
  }

  async findActive(): Promise<Supplier[]> {
    return await prisma.supplier.findMany({
      where: { status: 'active' },
      orderBy: { companyName: 'asc' },
    });
  }

  async searchByCompanyName(searchTerm: string): Promise<Supplier[]> {
    return await prisma.supplier.findMany({
      where: {
        companyName: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      orderBy: { companyName: 'asc' },
    });
  }

  async create(data: CreateSupplierInput): Promise<Supplier> {
    return await prisma.supplier.create({
      data: {
        ...data,
        status: data.status || 'active',
      },
    });
  }

  async update(id: string, data: UpdateSupplierInput): Promise<Supplier> {
    return await prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Supplier> {
    return await prisma.supplier.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }

  async delete(id: string): Promise<Supplier> {
    return await prisma.supplier.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<Supplier> {
    return await prisma.supplier.update({
      where: { id },
      data: { status },
    });
  }
}

export const supplierRepository = new SupplierRepository();
