import { expenseRepository } from '@/repositories/expense.repository';
import { randomUUID } from 'crypto';
import { Prisma } from '@/lib/prisma';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseFilters,
  ExpenseByCategoryReport,
  ExpenseByVendorReport,
} from '@/types/expense.types';


export class ExpenseService {
  async createExpense(data: CreateExpenseInput) {
    if (data.amount <= 0) {
      throw new Error('Expense amount must be greater than 0');
    }

    return await expenseRepository.create({
      id: randomUUID(),
      Branch: { connect: { id: data.branchId } },
      expenseDate: data.expenseDate,
      category: data.category,
      amount: data.amount,
      description: data.description,
      paymentMethod: data.paymentMethod,
      vendor: data.vendor,
      receiptUrl: data.receiptUrl,
      updatedAt: new Date(),
    });
  }

  async updateExpense(id: string, data: UpdateExpenseInput) {
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error('Expense amount must be greater than 0');
    }

    return await expenseRepository.update(id, data);
  }

  async getExpenseById(id: string) {
    return await expenseRepository.findById(id);
  }

  async getAllExpenses(filters?: ExpenseFilters) {
    return await expenseRepository.findAll(filters);
  }

  async deleteExpense(id: string) {
    return await expenseRepository.delete(id);
  }

  async getExpensesByCategory(
    branchId?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<ExpenseByCategoryReport[]> {
    const results = await expenseRepository.getTotalByCategory(branchId, fromDate, toDate);

    const totalExpenses = results.reduce(
      (sum, r) => sum.plus(r._sum.amount || 0),
      new Prisma.Decimal(0)
    );

    return results.map((r) => ({
      category: r.category,
      total: new Prisma.Decimal(r._sum.amount || 0),
      percentage: totalExpenses.greaterThan(0)
        ? Number(new Prisma.Decimal(r._sum.amount || 0).dividedBy(totalExpenses).times(100).toFixed(2))
        : 0,
      count: r._count,
    }));
  }

  async getExpensesByVendor(
    branchId?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<ExpenseByVendorReport[]> {
    const results = await expenseRepository.getTotalByVendor(branchId, fromDate, toDate);

    return results
      .filter((r) => r.vendor !== null)
      .map((r) => ({
        vendor: r.vendor || 'Unknown',
        total: new Prisma.Decimal(r._sum.amount || 0),
        count: r._count,
      }))
      .sort((a, b) => Number(b.total.minus(a.total)));
  }

  async getSummary(branchId?: string, fromDate?: Date, toDate?: Date) {
    return await expenseRepository.getSummary(branchId, fromDate, toDate);
  }
}

export const expenseService = new ExpenseService();
