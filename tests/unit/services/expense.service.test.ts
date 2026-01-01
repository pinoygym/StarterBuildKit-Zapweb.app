
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expenseService } from '@/services/expense.service';
import { expenseRepository } from '@/repositories/expense.repository';

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
    }
}));

describe('ExpenseService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createExpense', () => {
        it('should create expense successfully', async () => {
            const input = {
                branchId: 'b1',
                expenseDate: new Date(),
                category: 'Utilities',
                amount: 100,
                description: 'Electric bill',
                paymentMethod: 'Cash',
            };
            vi.mocked(expenseRepository.create).mockResolvedValue({ id: 'ex-1', ...input } as any);

            const result = await expenseService.createExpense(input as any);

            expect(expenseRepository.create).toHaveBeenCalled();
            expect(result.id).toBe('ex-1');
        });

        it('should throw if amount <= 0', async () => {
            const input = { amount: 0 };
            await expect(expenseService.createExpense(input as any)).rejects.toThrow();
        });
    });

    describe('updateExpense', () => {
        it('should update expense', async () => {
            const id = 'ex-1';
            const input = { amount: 200 };
            vi.mocked(expenseRepository.update).mockResolvedValue({ id, amount: 200 } as any);

            await expenseService.updateExpense(id, input as any);
            expect(expenseRepository.update).toHaveBeenCalledWith(id, input);
        });
    });
});
