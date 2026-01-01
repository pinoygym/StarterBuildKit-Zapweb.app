import { prisma } from '@/lib/prisma';
import { Expense, Prisma } from '@prisma/client';
import { ExpenseFilters } from '@/types/expense.types';

export class ExpenseRepository {
  async create(data: Prisma.ExpenseCreateInput): Promise<Expense> {
    return await prisma.expense.create({
      data,
      include: {
        Branch: true,
      },
    });
  }

  async findById(id: string) {
    return await prisma.expense.findUnique({
      where: { id },
      include: {
        Branch: true,
      },
    });
  }

  async findAll(filters?: ExpenseFilters) {
    const where: Prisma.ExpenseWhereInput = {};

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters?.vendor) {
      where.vendor = {
        contains: filters.vendor,
        mode: 'insensitive',
      };
    }

    if (filters?.fromDate || filters?.toDate) {
      where.expenseDate = {};
      if (filters.fromDate) {
        where.expenseDate.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.expenseDate.lte = filters.toDate;
      }
    }

    return await prisma.expense.findMany({
      where,
      include: {
        Branch: true,
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async update(id: string, data: Prisma.ExpenseUpdateInput) {
    return await prisma.expense.update({
      where: { id },
      data,
      include: {
        Branch: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.expense.delete({
      where: { id },
    });
  }

  async getTotalByCategory(branchId?: string, fromDate?: Date, toDate?: Date) {
    const where: Prisma.ExpenseWhereInput = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (fromDate || toDate) {
      where.expenseDate = {};
      if (fromDate) {
        where.expenseDate.gte = fromDate;
      }
      if (toDate) {
        where.expenseDate.lte = toDate;
      }
    }

    return await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    });
  }

  async getTotalByVendor(branchId?: string, fromDate?: Date, toDate?: Date) {
    const where: Prisma.ExpenseWhereInput = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (fromDate || toDate) {
      where.expenseDate = {};
      if (fromDate) {
        where.expenseDate.gte = fromDate;
      }
      if (toDate) {
        where.expenseDate.lte = toDate;
      }
    }

    return await prisma.expense.groupBy({
      by: ['vendor'],
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    });
  }

  async getSummary(branchId?: string, fromDate?: Date, toDate?: Date) {
    const where: Prisma.ExpenseWhereInput = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (fromDate || toDate) {
      where.expenseDate = {};
      if (fromDate) {
        where.expenseDate.gte = fromDate;
      }
      if (toDate) {
        where.expenseDate.lte = toDate;
      }
    }

    const result = await prisma.expense.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    });

    return {
      totalAmount: result._sum.amount || 0,
      count: result._count,
    };
  }
}

export const expenseRepository = new ExpenseRepository();
