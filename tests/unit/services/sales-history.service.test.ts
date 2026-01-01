
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { salesHistoryService } from '@/services/sales-history.service';
import { prisma, Prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        pOSSale: { count: vi.fn(), findMany: vi.fn() },
    },
    Prisma: { Decimal: class { constructor(public val: number) { } } }
}));

describe('SalesHistoryService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getSalesHistory', () => {
        it('should return paginated results', async () => {
            vi.mocked(prisma.pOSSale.count).mockResolvedValue(100);
            vi.mocked(prisma.pOSSale.findMany).mockResolvedValue(Array(10).fill({ id: 's1' }) as any);

            const result = await salesHistoryService.getSalesHistory({ page: 1, limit: 10 });

            expect(result.pagination.total).toBe(100);
            expect(result.pagination.totalPages).toBe(10);
            expect(result.sales).toHaveLength(10);
        });
    });
});
