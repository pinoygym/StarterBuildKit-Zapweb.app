
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '@/services/dashboard.service';
import { prisma, Prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        product: { count: vi.fn(), findMany: vi.fn() },
        inventory: { findMany: vi.fn() },
        salesOrder: { count: vi.fn(), groupBy: vi.fn() },
        pOSSale: { findMany: vi.fn() },
        accountsReceivable: { findMany: vi.fn(), count: vi.fn() },
        accountsPayable: { findMany: vi.fn(), count: vi.fn() },
        expense: { findMany: vi.fn() },
        pOSSaleItem: { findMany: vi.fn() },
        warehouse: { findMany: vi.fn(), count: vi.fn() },
        branch: { findMany: vi.fn(), count: vi.fn() },
        customer: { count: vi.fn() },
        supplier: { count: vi.fn() },
        purchaseOrder: { count: vi.fn(), findMany: vi.fn() },
        receivingVoucher: { count: vi.fn() },
        user: { count: vi.fn() },
        role: { count: vi.fn() },
        inventoryAdjustment: { findMany: vi.fn() },
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
            toString() { return String(this.val) }
            toNumber() { return this.val }
        }
    }
}));

describe('DashboardService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getKPIs', () => {
        it('should calculate KPIs correctly', async () => {
            // Mock counts
            vi.mocked(prisma.product.count).mockResolvedValue(10);
            vi.mocked(prisma.inventory.findMany).mockResolvedValue([{ quantity: 5 }, { quantity: 15 }] as any);
            vi.mocked(prisma.salesOrder.count).mockResolvedValue(5);

            // Mock Product findMany with Inventory for value calculation
            vi.mocked(prisma.product.findMany).mockResolvedValue([
                { Inventory: [{ quantity: 10 }], averageCostPrice: 50 }
            ] as any);

            // Mock other finds
            vi.mocked(prisma.pOSSale.findMany).mockResolvedValue([
                { totalAmount: new Prisma.Decimal(100), POSSaleItem: [] }
            ] as any);
            vi.mocked(prisma.accountsReceivable.findMany).mockResolvedValue([]);
            vi.mocked(prisma.accountsReceivable.count).mockResolvedValue(0);
            vi.mocked(prisma.accountsPayable.findMany).mockResolvedValue([]);
            vi.mocked(prisma.accountsPayable.count).mockResolvedValue(0);
            vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

            const result = await dashboardService.getKPIs();

            expect(result.totalProducts).toBe(10);
            expect(result.totalStock).toBe(20);
            expect(result.inventoryValue.toNumber()).toBe(500); // 10 * 50
        });
    });

    describe('getTopSellingProducts', () => {
        it('should aggregate top selling products', async () => {
            vi.mocked(prisma.pOSSaleItem.findMany).mockResolvedValue([
                { productId: 'p1', quantity: 2, subtotal: new Prisma.Decimal(200), Product: { name: 'P1' } },
                { productId: 'p1', quantity: 3, subtotal: new Prisma.Decimal(300), Product: { name: 'P1' } },
                { productId: 'p2', quantity: 1, subtotal: new Prisma.Decimal(50), Product: { name: 'P2' } },
            ] as any);

            const result = await dashboardService.getTopSellingProducts();

            expect(result).toHaveLength(2);
            expect(result[0].productName).toBe('P1');
            expect(result[0].revenue.toNumber()).toBe(500);
            expect(result[1].productName).toBe('P2');
        });
    });

    describe('getLowStockProducts', () => {
        it('should identify low and critical stock', async () => {
            vi.mocked(prisma.product.findMany).mockResolvedValue([
                { id: '1', name: 'Critical', minStockLevel: 10, Inventory: [{ quantity: 0 }] },
                { id: '2', name: 'Low', minStockLevel: 10, Inventory: [{ quantity: 8 }] },
                { id: '3', name: 'Fine', minStockLevel: 10, Inventory: [{ quantity: 20 }] },
            ] as any);

            const result = await dashboardService.getLowStockProducts();

            expect(result).toHaveLength(2);
            expect(result.find(p => p.productName === 'Critical')?.status).toBe('critical');
            expect(result.find(p => p.productName === 'Low')?.status).toBe('low');
        });
    });
});
