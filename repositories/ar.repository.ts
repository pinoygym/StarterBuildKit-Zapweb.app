import { prisma } from '@/lib/prisma';
import { AccountsReceivable, ARPayment, Prisma } from '@prisma/client';
import { ARFilters } from '@/types/ar.types';

export class ARRepository {
  async create(data: Prisma.AccountsReceivableCreateInput): Promise<AccountsReceivable> {
    return await prisma.accountsReceivable.create({
      data,
      include: {
        branch: true,
        payments: true,
      },
    });
  }

  async findById(id: string) {
    return await prisma.accountsReceivable.findUnique({
      where: { id },
      include: {
        branch: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
  }

  async findAll(filters?: ARFilters) {
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

    return await prisma.accountsReceivable.findMany({
      where,
      include: {
        branch: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.AccountsReceivableUpdateInput) {
    return await prisma.accountsReceivable.update({
      where: { id },
      data,
      include: {
        branch: true,
        payments: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.accountsReceivable.delete({
      where: { id },
    });
  }

  async createPayment(data: Prisma.ARPaymentCreateInput): Promise<ARPayment> {
    return await prisma.aRPayment.create({
      data,
    });
  }

  async findPaymentsByARId(arId: string) {
    return await prisma.aRPayment.findMany({
      where: { arId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async getAgingReport(branchId?: string) {
    const where: Prisma.AccountsReceivableWhereInput = {
      status: {
        in: ['pending', 'partial', 'overdue'],
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    return await prisma.accountsReceivable.findMany({
      where,
      include: {
        branch: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getSummary(branchId?: string) {
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
  }
}

export const arRepository = new ARRepository();
