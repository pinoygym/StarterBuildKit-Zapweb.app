import { prisma } from '@/lib/prisma';
import { AccountsReceivable, ARPayment, Prisma } from '@prisma/client';
import { ARFilters } from '@/types/ar.types';
import { withErrorHandling } from '@/lib/errors';

export class ARRepository {
  async create(data: Prisma.AccountsReceivableCreateInput, tx?: any): Promise<AccountsReceivable> {
    return withErrorHandling(async () => {
      const client = tx || prisma;
      const row = await client.accountsReceivable.create({
        data,
        include: {
          Branch: true,
          ARPayment: true,
        },
      });
      return { ...row, payments: (row as any).ARPayment, branch: (row as any).Branch } as any;
    }, 'ARRepository.create');
  }

  async findById(id: string) {
    return withErrorHandling(async () => {
      const row = await prisma.accountsReceivable.findUnique({
        where: { id },
        include: {
          Branch: true,
          ARPayment: {
            orderBy: { paymentDate: 'desc' },
          },
        },
      });
      if (!row) return null;
      return { ...row, payments: (row as any).ARPayment, branch: (row as any).Branch } as any;
    }, 'ARRepository.findById');
  }

  async findAll(filters?: ARFilters) {
    return withErrorHandling(async () => {
      const where: Prisma.AccountsReceivableWhereInput = {};

      if (filters?.branchId) {
        where.branchId = filters.branchId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.customerName) {
        where.customerName = {
          contains: filters.customerName,
          mode: 'insensitive',
        };
      }

      if (filters?.fromDate || filters?.toDate) {
        where.createdAt = {};
        if (filters.fromDate) {
          where.createdAt.gte = filters.fromDate;
        }
        if (filters.toDate) {
          where.createdAt.lte = filters.toDate;
        }
      }

      const rows = await prisma.accountsReceivable.findMany({
        where,
        include: {
          Branch: true,
          ARPayment: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((r: any) => ({ ...r, payments: r.ARPayment, branch: r.Branch }));
    }, 'ARRepository.findAll');
  }

  async update(id: string, data: Prisma.AccountsReceivableUpdateInput) {
    return withErrorHandling(async () => {
      const row2 = await prisma.accountsReceivable.update({
        where: { id },
        data,
        include: {
          Branch: true,
          ARPayment: true,
        },
      });
      return { ...row2, payments: (row2 as any).ARPayment, branch: (row2 as any).Branch } as any;
    }, 'ARRepository.update');
  }

  async delete(id: string) {
    return withErrorHandling(async () => {
      return await prisma.accountsReceivable.delete({
        where: { id },
      });
    }, 'ARRepository.delete');
  }

  async createPayment(data: Prisma.ARPaymentCreateInput): Promise<ARPayment> {
    return withErrorHandling(async () => {
      return await prisma.aRPayment.create({
        data,
      });
    }, 'ARRepository.createPayment');
  }

  async findPaymentsByARId(arId: string) {
    return withErrorHandling(async () => {
      return await prisma.aRPayment.findMany({
        where: { arId },
        orderBy: { paymentDate: 'desc' },
      });
    }, 'ARRepository.findPaymentsByARId');
  }

  async getAgingReport(branchId?: string) {
    return withErrorHandling(async () => {
      const where: Prisma.AccountsReceivableWhereInput = {
        status: {
          in: ['pending', 'partial', 'overdue'],
        },
      };

      if (branchId) {
        where.branchId = branchId;
      }

      const rows2 = await prisma.accountsReceivable.findMany({
        where,
        include: {
          Branch: true,
        },
        orderBy: { dueDate: 'asc' },
      });
      return rows2.map((r: any) => ({ ...r, branch: r.Branch }));
    }, 'ARRepository.getAgingReport');
  }

  async getSummary(branchId?: string) {
    return withErrorHandling(async () => {
      const where: Prisma.AccountsReceivableWhereInput = {};
      if (branchId) {
        where.branchId = branchId;
      }

      const result = await prisma.accountsReceivable.aggregate({
        where,
        _sum: {
          totalAmount: true,
          paidAmount: true,
          balance: true,
        },
        _count: true,
      });

      const countByStatus = await prisma.accountsReceivable.groupBy({
        by: ['status'],
        where,
        _count: true,
      });

      return {
        totals: result._sum,
        count: result._count,
        countByStatus,
      };
    }, 'ARRepository.getSummary');
  }
}

export const arRepository = new ARRepository();
