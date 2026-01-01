import { prisma } from '@/lib/prisma';
import { Supplier } from '@prisma/client';
import { CreateSupplierInput, UpdateSupplierInput, SupplierFilters } from '@/types/supplier.types';
import { withErrorHandling } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

export class SupplierRepository {
  async findAll(filters?: SupplierFilters): Promise<Supplier[]> {
    return withErrorHandling(async () => {
      const where: any = {};

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.search) {
        where.companyName = {
          contains: filters.search,
          mode: 'insensitive'
        };
      }

      return await prisma.supplier.findMany({
        where,
        orderBy: { companyName: 'asc' }
      });
    }, 'SupplierRepository.findAll');
  }

  async findById(id: string): Promise<Supplier | null> {
    return withErrorHandling(async () => {
      return await prisma.supplier.findUnique({
        where: { id }
      });
    }, 'SupplierRepository.findById');
  }

  async findByCompanyName(companyName: string): Promise<Supplier | null> {
    return withErrorHandling(async () => {
      return await prisma.supplier.findFirst({
        where: {
          companyName: {
            equals: companyName,
            mode: 'insensitive'
          }
        }
      });
    }, 'SupplierRepository.findByCompanyName');
  }

  async findActive(): Promise<Supplier[]> {
    return withErrorHandling(async () => {
      return await prisma.supplier.findMany({
        where: { status: 'active' },
        orderBy: { companyName: 'asc' }
      });
    }, 'SupplierRepository.findActive');
  }

  async searchByCompanyName(searchTerm: string): Promise<Supplier[]> {
    return withErrorHandling(async () => {
      return await prisma.supplier.findMany({
        where: {
          companyName: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        orderBy: { companyName: 'asc' }
      });
    }, 'SupplierRepository.searchByCompanyName');
  }

  async create(data: CreateSupplierInput): Promise<Supplier> {
    return withErrorHandling(async () => {
      return await prisma.supplier.create({
        data: {
          ...data,
          id: uuidv4(),
          status: data.status || 'active'
        }
      });
    }, 'SupplierRepository.create');
  }

  async update(id: string, data: UpdateSupplierInput): Promise<Supplier> {
    return withErrorHandling(async () => {
      return await prisma.supplier.update({
        where: { id },
        data
      });
    }, 'SupplierRepository.update');
  }

  async softDelete(id: string): Promise<Supplier> {
    return withErrorHandling(async () => {
      return await prisma.supplier.update({
        where: { id },
        data: { status: 'inactive' }
      });
    }, 'SupplierRepository.softDelete');
  }

  async delete(id: string): Promise<Supplier> {
    return withErrorHandling(async () => {
      return await prisma.supplier.delete({
        where: { id }
      });
    }, 'SupplierRepository.delete');
  }

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<Supplier> {
    return withErrorHandling(async () => {
      return await prisma.supplier.update({
        where: { id },
        data: { status }
      });
    }, 'SupplierRepository.updateStatus');
  }
}

export const supplierRepository = new SupplierRepository();
