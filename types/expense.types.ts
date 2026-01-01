import { Expense, Branch } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface ExpenseWithBranch extends Expense {
  branch: Branch;
}

export interface ExpenseSummary {
  totalExpenses: Decimal;
  countByCategory: {
    category: string;
    count: number;
    total: Decimal;
  }[];
  countByVendor: {
    vendor: string;
    count: number;
    total: Decimal;
  }[];
}

export interface ExpenseByCategoryReport {
  category: string;
  total: Decimal;
  percentage: number;
  count: number;
}

export interface ExpenseByVendorReport {
  vendor: string;
  total: Decimal;
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
