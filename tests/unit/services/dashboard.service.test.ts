import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '@/services/dashboard.service';
import { prisma, Prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    inventory: {
      findMany: vi.fn(),
    },
    salesOrder: {
      count: vi.fn(),
    },
    pOSSale: {
      findMany: vi.fn(),
    },
    pOSSaleItem: {
      findMany: vi.fn(),
    },
    accountsReceivable: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    accountsPayable: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
    },
    warehouse: {
      findMany: vi.fn(),
    },
    branch: {
      findMany: vi.fn(),
    },
  },
  Prisma: {
    Decimal: class {
      constructor(value: number) {
        this.value = Number(value);
      }
      plus(other: any) { return new Prisma.Decimal(this.value + Number(other.value || other)); }
      minus(other: any) { return new Prisma.Decimal(this.value - Number(other.value || other)); }
      times(other: any) { return new Prisma.Decimal(this.value * Number(other.value || other)); }
      dividedBy(other: any) { return new Prisma.Decimal(this.value / Number(other.value || other)); }
      toNumber() { return this.value; }
      toJSON() { return this.value; }
      toString() { return String(this.value); }
    }
  }
}));

describe('DashboardService', () => {
  let dashboardService: DashboardService;

  beforeEach(() => {
    dashboardService = new DashboardService();
    vi.clearAllMocks();
  });

  describe('getKPIs', () => {
    it('should generate KPIs', async () => {
      vi.mocked(prisma.product.count).mockResolvedValue(100);
      vi.mocked(prisma.inventory.findMany).mockResolvedValue([{ quantity: 50 }] as any);
      vi.mocked(prisma.salesOrder.count).mockResolvedValue(10); // Active and Total
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { Inventory: [{ quantity: 10 }], averageCostPrice: 50 }
      ] as any);
      vi.mocked(prisma.pOSSale.findMany).mockResolvedValue([
        { totalAmount: new Prisma.Decimal(200) }
      ] as any);
      vi.mocked(prisma.accountsReceivable.findMany).mockResolvedValue([
        { balance: new Prisma.Decimal(100) }
      ] as any);
      vi.mocked(prisma.accountsReceivable.count).mockResolvedValue(5);
      vi.mocked(prisma.accountsPayable.findMany).mockResolvedValue([
        { balance: new Prisma.Decimal(50) }
      ] as any);
      vi.mocked(prisma.accountsPayable.count).mockResolvedValue(2);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([
        { amount: new Prisma.Decimal(30) }
      ] as any);

      const result = await dashboardService.getKPIs();

      expect(result.totalProducts).toBe(100);
      expect(result.totalStock).toBe(50);
      expect(result.activeSalesOrders).toBe(10);
      expect(result.inventoryValue.toNumber()).toBe(500);
      expect(result.todaySalesRevenue.toNumber()).toBe(200);
      expect(result.outstandingAR.toNumber()).toBe(100);
      expect(result.outstandingAP.toNumber()).toBe(50);
      expect(result.currentMonthExpenses.toNumber()).toBe(30);
    });
  });

  describe('getTopSellingProducts', () => {
    it('should generate top selling products', async () => {
      const mockItems = [
        {
          productId: 'prod-1',
          quantity: new Prisma.Decimal(10),
          subtotal: new Prisma.Decimal(200),
          Product: { name: 'Product 1' },
        },
      ];
      vi.mocked(prisma.pOSSaleItem.findMany).mockResolvedValue(mockItems as any);

      const result = await dashboardService.getTopSellingProducts();

      expect(result).toHaveLength(1);
      expect(result[0].quantitySold).toBe(10);
      expect(result[0].revenue.toNumber()).toBe(200);
    });
  });

  describe('getWarehouseUtilization', () => {
    it('should generate warehouse utilization', async () => {
      const mockWarehouses = [
        {
          id: 'wh-1',
          name: 'Main',
          maxCapacity: 100,
          Inventory: [{ quantity: 80 }],
        },
      ];
      vi.mocked(prisma.warehouse.findMany).mockResolvedValue(mockWarehouses as any);

      const result = await dashboardService.getWarehouseUtilization();

      expect(result).toHaveLength(1);
      expect(result[0].utilizationPercentage).toBe(80);
      expect(result[0].status).toBe('critical');
    });
  });

  describe('getBranchComparison', () => {
    it('should generate branch comparison', async () => {
      const mockBranches = [
        {
          id: 'branch-1',
          name: 'Branch 1',
          POSSale: [
            {
              totalAmount: new Prisma.Decimal(200),
              POSSaleItem: [{ costOfGoodsSold: new Prisma.Decimal(100) }],
            },
          ],
          Expense: [{ amount: new Prisma.Decimal(50) }],
          Warehouse: [
            {
              Inventory: [
                {
                    quantity: new Prisma.Decimal(10),
                    Product: { averageCostPrice: new Prisma.Decimal(10) }
                }
              ],
            },
          ],
        },
      ];
      vi.mocked(prisma.branch.findMany).mockResolvedValue(mockBranches as any);

      const result = await dashboardService.getBranchComparison();

      expect(result).toHaveLength(1);
      expect(result[0].revenue.toNumber()).toBe(200);
      expect(result[0].expenses.toNumber()).toBe(50);
      expect(result[0].profit.toNumber()).toBe(50); // 200 - 100 - 50
      expect(result[0].inventoryValue.toNumber()).toBe(100);
    });
  });

  describe('getSalesTrends', () => {
    it('should generate sales trends', async () => {
      const mockSales = [
        {
          createdAt: new Date(),
          totalAmount: new Prisma.Decimal(100),
        },
      ];
      vi.mocked(prisma.pOSSale.findMany).mockResolvedValue(mockSales as any);

      const result = await dashboardService.getSalesTrends();

      expect(result).toHaveLength(7);
      // The last element corresponds to "today"
      expect(result[result.length - 1].revenue).toBe(100);
    });
  });

  describe('getLowStockProducts', () => {
    it('should identify low stock products', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Product 1',
          minStockLevel: 10,
          Inventory: [{ quantity: 4 }],
        },
      ];
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const result = await dashboardService.getLowStockProducts();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('critical'); // 4 < 10 * 0.5 (5)
    });
  });
});
