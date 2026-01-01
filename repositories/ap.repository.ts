import { prisma } from '@/lib/prisma';
import { AccountsPayable, APPayment, Prisma } from '@prisma/client';
import { APFilters } from '@/types/ap.types';

export class APRepository {
  async create(data: Prisma.AccountsPayableCreateInput): Promise<AccountsPayable> {
    return await prisma.accountsPayable.create({
      data,
      include: {
        branch: true,
        supplier: true,
        payments: true,
      },
    });
  }

  async findById(id: string) {
    return await prisma.accountsPayable.findUnique({
      where: { id },
      include: {
        branch: true,
        supplier: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
  }

  async findAll(filters?: APFilters) {
    const where: Prisma.AccountsPayableWhereInput = {};

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.status) {
      where.status = filters.status;
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

    return await prisma.accountsPayable.findMany({
      where,
      include: {
        branch: true,
        supplier: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.AccountsPayableUpdateInput) {
    return await prisma.accountsPayable.update({
      where: { id },
      data,
      include: {
        branch: true,
        supplier: true,
        payments: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.accountsPayable.delete({
      where: { id },
    });
  }

  async createPayment(data: Prisma.APPaymentCreateInput): Promise<APPayment> {
    return await prisma.aPPayment.create({
      data,
    });
  }

  async findPaymentsByAPId(apId: string) {
    return await prisma.aPPayment.findMany({
      where: { apId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async getAgingReport(branchId?: string) {
    const where: Prisma.AccountsPayableWhereInput = {
      status: {
        in: ['pending', 'partial', 'overdue'],
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    return await prisma.accountsPayable.findMany({
      where,
      include: {
        branch: true,
        supplier: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getSummary(branchId?: string) {
    const where: Prisma.AccountsPayableWhereInput = {};
    if (branchId) {
      where.branchId = branchId;
    }

    const result = await prisma.accountsPayable.aggregate({
      where,
      _sum: {
        totalAmount: true,
        paidAmount: true,
        balance: true,
      },
      _count: true,
    });

    const countByStatus = await prisma.accountsPayable.groupBy({
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

export const apRepository = new APRepository();
