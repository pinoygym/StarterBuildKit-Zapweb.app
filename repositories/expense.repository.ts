import { prisma } from '@/lib/prisma';
import { Expense, Prisma } from '@prisma/client';
import { ExpenseFilters } from '@/types/expense.types';
import { withErrorHandling } from '@/lib/errors';

export class ExpenseRepository {
  async create(data: Prisma.ExpenseCreateInput): Promise<Expense> {
    return withErrorHandling(async () => {
      return await prisma.expense.create({
        data,
        include: {
          Branch: true,
        },
      });
    }, 'ExpenseRepository.create');
  }

  async findById(id: string) {
    return withErrorHandling(async () => {
      return await prisma.expense.findUnique({
        where: { id },
        include: {
          Branch: true,
        },
      });
    }, 'ExpenseRepository.findById');
  }

  async findAll(filters?: ExpenseFilters) {
    return withErrorHandling(async () => {
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
    }, 'ExpenseRepository.findAll');
  }

  async update(id: string, data: Prisma.ExpenseUpdateInput) {
    return withErrorHandling(async () => {
      return await prisma.expense.update({
        where: { id },
        data,
        include: {
          Branch: true,
        },
      });
    }, 'ExpenseRepository.update');
  }

  async delete(id: string) {
    return withErrorHandling(async () => {
      return await prisma.expense.delete({
        where: { id },
      });
    }, 'ExpenseRepository.delete');
  }

  async getTotalByCategory(branchId?: string, fromDate?: Date, toDate?: Date) {
    return withErrorHandling(async () => {
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
    }, 'ExpenseRepository.getTotalByCategory');
  }

  async getTotalByVendor(branchId?: string, fromDate?: Date, toDate?: Date) {
    return withErrorHandling(async () => {
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
    }, 'ExpenseRepository.getTotalByVendor');
  }

  async getSummary(branchId?: string, fromDate?: Date, toDate?: Date) {
    return withErrorHandling(async () => {
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
    }, 'ExpenseRepository.getSummary');
  }
}

export const expenseRepository = new ExpenseRepository();
