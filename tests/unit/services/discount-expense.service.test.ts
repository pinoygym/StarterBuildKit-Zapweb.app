import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscountExpenseService } from '@/services/discount-expense.service';
import { prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    expenseCategory: {
      findFirst: vi.fn(),
    },
    expense: {
      create: vi.fn(),
    },
  },
}));

describe('DiscountExpenseService', () => {
  let discountExpenseService: DiscountExpenseService;

  beforeEach(() => {
    discountExpenseService = new DiscountExpenseService();
    vi.clearAllMocks();
  });

  describe('createDiscountExpense', () => {
    const branchId = 'branch-1';
    const receiptNumber = 'REC-001';

    it('should create discount expense if discount > 0 and category exists', async () => {
      const category = { name: 'Discounts', id: 'cat-1' };
      vi.mocked(prisma.expenseCategory.findFirst).mockResolvedValue(category as any);

      await discountExpenseService.createDiscountExpense(10, receiptNumber, branchId);

      expect(prisma.expenseCategory.findFirst).toHaveBeenCalledWith({
        where: { code: 'DISC', status: 'active' },
      });
      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          branchId,
          amount: 10,
          category: category.name,
          description: expect.stringContaining(receiptNumber),
        }),
      });
    });

    it('should NOT create expense if discount is 0', async () => {
      await discountExpenseService.createDiscountExpense(0, receiptNumber, branchId);

      expect(prisma.expenseCategory.findFirst).not.toHaveBeenCalled();
      expect(prisma.expense.create).not.toHaveBeenCalled();
    });

    it('should NOT create expense if category not found', async () => {
      vi.mocked(prisma.expenseCategory.findFirst).mockResolvedValue(null);

      await discountExpenseService.createDiscountExpense(10, receiptNumber, branchId);

      expect(prisma.expenseCategory.findFirst).toHaveBeenCalled();
      expect(prisma.expense.create).not.toHaveBeenCalled();
    });

    it('should use transaction client if provided', async () => {
      const category = { name: 'Discounts', id: 'cat-1' };
      const tx = {
        expenseCategory: { findFirst: vi.fn().mockResolvedValue(category) },
        expense: { create: vi.fn() },
      };

      await discountExpenseService.createDiscountExpense(10, receiptNumber, branchId, undefined, tx);

      expect(tx.expenseCategory.findFirst).toHaveBeenCalled();
      expect(tx.expense.create).toHaveBeenCalled();
      expect(prisma.expenseCategory.findFirst).not.toHaveBeenCalled();
    });
  });
});
