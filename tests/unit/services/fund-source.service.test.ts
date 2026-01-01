
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fundSourceService } from '@/services/fund-source.service';
import { fundSourceRepository, fundTransferRepository, fundTransactionRepository } from '@/repositories/fund-source.repository';
import { prisma } from '@/lib/prisma';

vi.mock('@/repositories/fund-source.repository', () => ({
    fundSourceRepository: {
        findByCode: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findAll: vi.fn(),
        findByBranch: vi.fn(),
        getSummary: vi.fn(),
        getDefaultFundSource: vi.fn(),
    },
    fundTransferRepository: {
        getNextTransferNumber: vi.fn(),
        findById: vi.fn(),
        findAll: vi.fn(),
    },
    fundTransactionRepository: {
        findByFundSource: vi.fn(),
        getRecentTransactions: vi.fn(),
    }
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        $transaction: vi.fn((cb) => cb({
            fundSource: { create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() },
            fundTransaction: { create: vi.fn() },
            fundTransfer: { create: vi.fn() },
        })),
        fundSource: { updateMany: vi.fn() },
    },
}));

describe('FundSourceService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createFundSource', () => {
        it('should throw if code exists', async () => {
            vi.mocked(fundSourceRepository.findByCode).mockResolvedValue({ id: 'exists' } as any);
            await expect(fundSourceService.createFundSource({ code: 'FS1' } as any, 'u1')).rejects.toThrow();
        });

        it('should create fund source', async () => {
            vi.mocked(fundSourceRepository.findByCode).mockResolvedValue(null);
            // mock transaction impl
            const mockTx = {
                fundSource: { create: vi.fn().mockResolvedValue({ id: 'fs-1' }) },
                fundTransaction: { create: vi.fn() }
            };
            vi.mocked(prisma.$transaction).mockImplementation((cb) => cb(mockTx as any));

            const result = await fundSourceService.createFundSource({ code: 'FS1', name: 'Cash' } as any, 'u1');
            expect(mockTx.fundSource.create).toHaveBeenCalled();
            expect(result.id).toBe('fs-1');
        });
    });

    describe('recordDeposit', () => {
        it('should update balance and create transaction', async () => {
            const mockTx = {
                fundSource: { findUnique: vi.fn().mockResolvedValue({ id: 'fs-1', currentBalance: 100 }), update: vi.fn() },
                fundTransaction: { create: vi.fn() }
            };

            await fundSourceService.recordDeposit('fs-1', 50, 'Sales', 'u1', undefined, undefined, mockTx as any);

            expect(mockTx.fundSource.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'fs-1' }, data: { currentBalance: 150 } })
            );
        });
    });

    describe('recordWithdrawal', () => {
        it('should throw if insufficient balance', async () => {
            const mockTx = {
                fundSource: { findUnique: vi.fn().mockResolvedValue({ id: 'fs-1', currentBalance: 10 }) },
            };

            await expect(
                fundSourceService.recordWithdrawal('fs-1', 50, 'Exp', 'u1', undefined, undefined, mockTx as any)
            ).rejects.toThrow('Insufficient balance');
        });
    });
});
