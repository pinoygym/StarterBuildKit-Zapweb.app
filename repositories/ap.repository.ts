import { prisma } from '@/lib/prisma';
import { AccountsPayable, APPayment, Prisma } from '@prisma/client';
import { APFilters } from '@/types/ap.types';

export class APRepository {
  async create(data: Prisma.AccountsPayableCreateInput): Promise<AccountsPayable> {
    const row = await prisma.accountsPayable.create({
      data,
      include: {
        Branch: true,
        Supplier: true,
        APPayment: true,
      },
    });
    return { ...row, branch: (row as any).Branch, supplier: (row as any).Supplier, payments: (row as any).APPayment } as any;
  }

  async findById(id: string) {
    const row = await prisma.accountsPayable.findUnique({
      where: { id },
      include: {
        Branch: true,
        Supplier: true,
        APPayment: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
    if (!row) return null;
    return { ...row, branch: (row as any).Branch, supplier: (row as any).Supplier, payments: (row as any).APPayment } as any;
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

    const rows = await prisma.accountsPayable.findMany({
      where,
      include: {
        Branch: true,
        Supplier: true,
        APPayment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: any) => ({ ...r, branch: r.Branch, supplier: r.Supplier, payments: r.APPayment }));
  }

  async update(id: string, data: Prisma.AccountsPayableUpdateInput) {
    const row2 = await prisma.accountsPayable.update({
      where: { id },
      data,
      include: {
        Branch: true,
        Supplier: true,
        APPayment: true,
      },
    });
    return { ...row2, branch: (row2 as any).Branch, supplier: (row2 as any).Supplier, payments: (row2 as any).APPayment } as any;
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

    const rows2 = await prisma.accountsPayable.findMany({
      where,
      include: {
        Branch: true,
        Supplier: true,
      },
      orderBy: { dueDate: 'asc' },
    });
    return rows2.map((r: any) => ({ ...r, branch: r.Branch, supplier: r.Supplier }));
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
