
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportService } from '@/services/report.service';
import { prisma, Prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        inventory: { findMany: vi.fn() },
        pOSSale: { findMany: vi.fn() },
        pOSSaleItem: { findMany: vi.fn() },
        expense: { findMany: vi.fn() },
    },
    Prisma: {
        Decimal: class {
            constructor(public val: number) { this.val = Number(val) || 0; }
            plus(other: any) {
                const otherVal = other instanceof (Prisma as any).Decimal ? other.val : Number(other);
                return new (Prisma as any).Decimal(this.val + otherVal);
            }
            minus(other: any) {
                const otherVal = other instanceof (Prisma as any).Decimal ? other.val : Number(other);
                return new (Prisma as any).Decimal(this.val - otherVal);
            }
            times(other: any) {
                const otherVal = other instanceof (Prisma as any).Decimal ? other.val : Number(other);
                return new (Prisma as any).Decimal(this.val * otherVal);
            }
            dividedBy(other: any) {
                const otherVal = other instanceof (Prisma as any).Decimal ? other.val : Number(other);
                return new (Prisma as any).Decimal(this.val / otherVal);
            }
            toString() { return String(this.val) }
            toNumber() { return this.val }
            greaterThan(other: any) { return this.val > Number(other) }
        }
    }
}));

describe('ReportService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getStockLevelReport', () => {
        it('should classify stock status correctly', async () => {
            vi.mocked(prisma.inventory.findMany).mockResolvedValue([
                { quantity: 0, Product: { minStockLevel: 10, name: 'P1' }, Warehouse: { name: 'W1' } },
                { quantity: 5, Product: { minStockLevel: 10, name: 'P2' }, Warehouse: { name: 'W1' } },
                { quantity: 20, Product: { minStockLevel: 10, name: 'P3' }, Warehouse: { name: 'W1' } },
            ] as any);

            const result = await reportService.getStockLevelReport();

            expect(result.find(i => i.productName === 'P1')?.status).toBe('critical');
            expect(result.find(i => i.productName === 'P2')?.status).toBe('low');
            expect(result.find(i => i.productName === 'P3')?.status).toBe('adequate');
        });
    });

    describe('getSalesReport', () => {
        it('should aggregate daily sales', async () => {
            const now = new Date();
            vi.mocked(prisma.pOSSale.findMany).mockResolvedValue([
                {
                    createdAt: now,
                    totalAmount: new Prisma.Decimal(100),
                    POSSaleItem: [{ costOfGoodsSold: new Prisma.Decimal(50) }]
                }
            ] as any);

            const result = await reportService.getSalesReport();
            expect(result).toHaveLength(1);
            expect(result[0].totalRevenue.toNumber()).toBe(100);
            expect(result[0].grossProfit.toNumber()).toBe(50);
        });
    });
});
