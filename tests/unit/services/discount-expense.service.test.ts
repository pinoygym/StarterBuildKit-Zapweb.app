
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { discountExpenseService } from '@/services/discount-expense.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        expenseCategory: { findFirst: vi.fn() },
        expense: { create: vi.fn() },
    },
}));

describe('DiscountExpenseService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not create expense if total discount is 0', async () => {
        await discountExpenseService.createDiscountExpense(0, 'rec-1', 'br-1');
        expect(prisma.expense.create).not.toHaveBeenCalled();
    });

    it('should create expense if discount > 0 and category exists', async () => {
        vi.mocked(prisma.expenseCategory.findFirst).mockResolvedValue({ name: 'Discounts' } as any);

        await discountExpenseService.createDiscountExpense(100, 'rec-1', 'br-1');

        expect(prisma.expense.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                amount: 100,
                category: 'Discounts',
                description: expect.stringContaining('rec-1')
            })
        }));
    });

    it('should log warn and skip if category not found', async () => {
        vi.mocked(prisma.expenseCategory.findFirst).mockResolvedValue(null);
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        await discountExpenseService.createDiscountExpense(100, 'rec-1', 'br-1');

        expect(prisma.expense.create).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalled();
    });
});
