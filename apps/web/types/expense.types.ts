import { Expense, Branch, Prisma } from '@prisma/client';

export interface ExpenseWithBranch extends Expense {
  branch: Branch;
}

export interface ExpenseSummary {
  totalExpenses: Prisma.Decimal;
  countByCategory: {
    category: string;
    count: number;
    total: Prisma.Decimal;
  }[];
  countByVendor: {
    vendor: string;
    count: number;
    total: Prisma.Decimal;
  }[];
}

export interface ExpenseByCategoryReport {
  category: string;
  total: Prisma.Decimal;
  percentage: number;
  count: number;
}

export interface ExpenseByVendorReport {
  vendor: string;
  total: Prisma.Decimal;
  count: number;
}

export interface CreateExpenseInput {
  branchId: string;
  expenseDate: Date;
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  vendor?: string;
  receiptUrl?: string;
}

export interface UpdateExpenseInput {
  expenseDate?: Date;
  category?: string;
  amount?: number;
  description?: string;
  paymentMethod?: string;
  vendor?: string;
  receiptUrl?: string;
}

export interface ExpenseFilters {
  branchId?: string;
  category?: string;
  paymentMethod?: string;
  fromDate?: Date;
  toDate?: Date;
  vendor?: string;
}

export const ExpenseCategories = [
  'Utilities',
  'Rent',
  'Salaries',
  'Transportation',
  'Marketing',
  'Maintenance',
  'Other',
] as const;

export type ExpenseCategory = typeof ExpenseCategories[number];
