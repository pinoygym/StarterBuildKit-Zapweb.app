import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseService } from '@/services/expense.service';
import { expenseRepository } from '@/repositories/expense.repository';
import { Prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/repositories/expense.repository', () => ({
  expenseRepository: {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    delete: vi.fn(),
    getTotalByCategory: vi.fn(),
    getTotalByVendor: vi.fn(),
    getSummary: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
    Prisma: {
      Decimal: class {
        constructor(value: number) {
          this.value = Number(value);
        }
        plus(other: any) { return new Prisma.Decimal(this.value + Number(other.value || other)); }
        minus(other: any) { return new Prisma.Decimal(this.value - Number(other.value || other)); }
        times(other: any) { return new Prisma.Decimal(this.value * Number(other.value || other)); }
        dividedBy(other: any) { return new Prisma.Decimal(this.value / Number(other.value || other)); }
        greaterThan(other: any) { return this.value > Number(other); }
        toFixed(d: number) { return this.value.toFixed(d); }
        toNumber() { return this.value; }
        toJSON() { return this.value; }
        toString() { return String(this.value); }
      }
    }
}));

describe('ExpenseService', () => {
  let expenseService: ExpenseService;

  beforeEach(() => {
    expenseService = new ExpenseService();
    vi.clearAllMocks();
  });

  describe('createExpense', () => {
    const createInput = {
      branchId: 'branch-1',
      expenseDate: new Date(),
      category: 'Office',
      amount: 100,
      description: 'Supplies',
      paymentMethod: 'cash',
    };

    it('should create expense successfully', async () => {
      vi.mocked(expenseRepository.create).mockResolvedValue({ id: 'exp-1', ...createInput } as any);

      const result = await expenseService.createExpense(createInput);

      expect(result).toEqual(expect.objectContaining(createInput));
      expect(expenseRepository.create).toHaveBeenCalled();
    });

    it('should throw Error if amount is <= 0', async () => {
      await expect(expenseService.createExpense({ ...createInput, amount: 0 })).rejects.toThrow('Expense amount must be greater than 0');
      expect(expenseRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateExpense', () => {
    it('should update expense successfully', async () => {
      vi.mocked(expenseRepository.update).mockResolvedValue({ id: 'exp-1', amount: 200 } as any);

      const result = await expenseService.updateExpense('exp-1', { amount: 200 });

      expect(result.amount).toBe(200);
      expect(expenseRepository.update).toHaveBeenCalledWith('exp-1', { amount: 200 });
    });

    it('should throw Error if amount is <= 0', async () => {
      await expect(expenseService.updateExpense('exp-1', { amount: 0 })).rejects.toThrow('Expense amount must be greater than 0');
    });
  });

  describe('getExpenseById', () => {
    it('should return expense by id', async () => {
      const mockExpense = { id: 'exp-1' };
      vi.mocked(expenseRepository.findById).mockResolvedValue(mockExpense as any);

      const result = await expenseService.getExpenseById('exp-1');

      expect(result).toEqual(mockExpense);
      expect(expenseRepository.findById).toHaveBeenCalledWith('exp-1');
    });
  });

  describe('getAllExpenses', () => {
    it('should return all expenses', async () => {
      const mockExpenses = { expenses: [], total: 0 };
      vi.mocked(expenseRepository.findAll).mockResolvedValue(mockExpenses as any);

      const result = await expenseService.getAllExpenses();

      expect(result).toEqual(mockExpenses);
      expect(expenseRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('deleteExpense', () => {
    it('should delete expense', async () => {
      await expenseService.deleteExpense('exp-1');
      expect(expenseRepository.delete).toHaveBeenCalledWith('exp-1');
    });
  });

  describe('getExpensesByCategory', () => {
    it('should return expenses by category', async () => {
      const mockResults = [
        { category: 'Office', _sum: { amount: new Prisma.Decimal(100) }, _count: 1 },
      ];
      vi.mocked(expenseRepository.getTotalByCategory).mockResolvedValue(mockResults as any);

      const result = await expenseService.getExpensesByCategory();

      expect(result).toHaveLength(1);
      expect(result[0].total.toNumber()).toBe(100);
      expect(result[0].percentage).toBe(100);
    });
  });

  describe('getExpensesByVendor', () => {
    it('should return expenses by vendor', async () => {
      const mockResults = [
        { vendor: 'Vendor A', _sum: { amount: new Prisma.Decimal(100) }, _count: 1 },
      ];
      vi.mocked(expenseRepository.getTotalByVendor).mockResolvedValue(mockResults as any);

      const result = await expenseService.getExpensesByVendor();

      expect(result).toHaveLength(1);
      expect(result[0].vendor).toBe('Vendor A');
    });
  });

  describe('getSummary', () => {
      it('should return summary', async () => {
          const mockSummary = { totalExpenses: 100 };
          vi.mocked(expenseRepository.getSummary).mockResolvedValue(mockSummary as any);

          const result = await expenseService.getSummary();

          expect(result).toEqual(mockSummary);
          expect(expenseRepository.getSummary).toHaveBeenCalled();
      });
  });
});
