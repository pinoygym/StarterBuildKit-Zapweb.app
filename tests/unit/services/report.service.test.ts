import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportService } from '@/services/report.service';
import { prisma, Prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    inventory: {
      findMany: vi.fn(),
    },
    pOSSale: {
      findMany: vi.fn(),
    },
    pOSSaleItem: {
      findMany: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
    },
    aRPayment: {
      findMany: vi.fn(),
    },
    aPPayment: {
      findMany: vi.fn(),
    },
    accountsReceivable: {
      findMany: vi.fn(),
    },
    accountsPayable: {
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
      greaterThan(other: any) { return this.value > Number(other); }
      toNumber() { return this.value; }
      toJSON() { return this.value; }
      toString() { return String(this.value); }
    }
  }
}));

describe('ReportService', () => {
  let reportService: ReportService;

  beforeEach(() => {
    reportService = new ReportService();
    vi.clearAllMocks();
  });

  describe('getStockLevelReport', () => {
    it('should generate stock level report', async () => {
      const mockInventory = [
        {
          productId: 'prod-1',
          quantity: 10,
          warehouseId: 'wh-1',
          Warehouse: { name: 'Main Warehouse' },
          Product: {
            name: 'Product 1',
            category: 'Cat 1',
            baseUOM: 'pcs',
            minStockLevel: 5,
          },
        },
      ];
      vi.mocked(prisma.inventory.findMany).mockResolvedValue(mockInventory as any);

      const result = await reportService.getStockLevelReport();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('adequate');
      expect(prisma.inventory.findMany).toHaveBeenCalled();
    });

    it('should identify critical stock', async () => {
        const mockInventory = [
          {
            productId: 'prod-1',
            quantity: 0,
            warehouseId: 'wh-1',
            Warehouse: { name: 'Main Warehouse' },
            Product: {
              name: 'Product 1',
              category: 'Cat 1',
              baseUOM: 'pcs',
              minStockLevel: 5,
            },
          },
        ];
        vi.mocked(prisma.inventory.findMany).mockResolvedValue(mockInventory as any);

        const result = await reportService.getStockLevelReport();

        expect(result[0].status).toBe('critical');
    });

    it('should identify low stock', async () => {
        const mockInventory = [
          {
            productId: 'prod-1',
            quantity: 3,
            warehouseId: 'wh-1',
            Warehouse: { name: 'Main Warehouse' },
            Product: {
              name: 'Product 1',
              category: 'Cat 1',
              baseUOM: 'pcs',
              minStockLevel: 5,
            },
          },
        ];
        vi.mocked(prisma.inventory.findMany).mockResolvedValue(mockInventory as any);

        const result = await reportService.getStockLevelReport();

        expect(result[0].status).toBe('low');
    });
  });

  describe('getInventoryValueReport', () => {
    it('should generate inventory value report', async () => {
      const mockInventory = [
        {
          productId: 'prod-1',
          quantity: 10,
          Product: {
            name: 'Product 1',
            averageCostPrice: 100,
          },
        },
      ];
      vi.mocked(prisma.inventory.findMany).mockResolvedValue(mockInventory as any);

      const result = await reportService.getInventoryValueReport();

      expect(result).toHaveLength(1);
      expect(result[0].totalValue.toNumber()).toBe(1000);
      expect(prisma.inventory.findMany).toHaveBeenCalled();
    });
  });

  describe('getSalesReport', () => {
    it('should generate sales report', async () => {
      const mockSales = [
        {
          createdAt: new Date('2023-01-01T10:00:00Z'),
          totalAmount: new Prisma.Decimal(200),
          POSSaleItem: [
            { costOfGoodsSold: new Prisma.Decimal(100) },
          ],
        },
      ];
      vi.mocked(prisma.pOSSale.findMany).mockResolvedValue(mockSales as any);

      const result = await reportService.getSalesReport();

      expect(result).toHaveLength(1);
      expect(result[0].totalRevenue.toNumber()).toBe(200);
      expect(result[0].totalCOGS.toNumber()).toBe(100);
      expect(result[0].grossProfit.toNumber()).toBe(100);
      expect(prisma.pOSSale.findMany).toHaveBeenCalled();
    });
  });

  describe('getBestSellingProducts', () => {
    it('should generate best selling products report', async () => {
      const mockItems = [
        {
          productId: 'prod-1',
          quantity: new Prisma.Decimal(10),
          subtotal: new Prisma.Decimal(200),
          costOfGoodsSold: new Prisma.Decimal(100),
          Product: {
            name: 'Product 1',
            category: 'Cat 1',
          },
        },
      ];
      vi.mocked(prisma.pOSSaleItem.findMany).mockResolvedValue(mockItems as any);

      const result = await reportService.getBestSellingProducts(undefined, 5);

      expect(result).toHaveLength(1);
      expect(result[0].quantitySold).toBe(10);
      expect(result[0].revenue.toNumber()).toBe(200);
      expect(result[0].profit.toNumber()).toBe(100);
      expect(prisma.pOSSaleItem.findMany).toHaveBeenCalled();
    });
  });

  describe('getProfitLossStatement', () => {
    it('should generate profit loss statement', async () => {
      const mockSales = [
        {
          totalAmount: new Prisma.Decimal(200),
          POSSaleItem: [
            { costOfGoodsSold: new Prisma.Decimal(100) },
          ],
        },
      ];
      const mockExpenses = [
        { amount: new Prisma.Decimal(50) },
      ];

      vi.mocked(prisma.pOSSale.findMany).mockResolvedValue(mockSales as any);
      vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any);

      const result = await reportService.getProfitLossStatement();

      expect(result.revenue.toNumber()).toBe(200);
      expect(result.cogs.toNumber()).toBe(100);
      expect(result.grossProfit.toNumber()).toBe(100);
      expect(result.expenses.toNumber()).toBe(50);
      expect(result.netProfit.toNumber()).toBe(50);
    });
  });

  describe('getCashFlowStatement', () => {
    it('should generate cash flow statement', async () => {
        const mockSales = [
            { totalAmount: new Prisma.Decimal(200) },
        ];
        const mockARPayments = [
            { amount: new Prisma.Decimal(50) },
        ];
        const mockExpenses = [
            { amount: new Prisma.Decimal(30) },
        ];
        const mockAPPayments = [
            { amount: new Prisma.Decimal(20) },
        ];

        vi.mocked(prisma.pOSSale.findMany).mockResolvedValue(mockSales as any);
        vi.mocked(prisma.aRPayment.findMany).mockResolvedValue(mockARPayments as any);
        vi.mocked(prisma.expense.findMany).mockResolvedValue(mockExpenses as any);
        vi.mocked(prisma.aPPayment.findMany).mockResolvedValue(mockAPPayments as any);

        const result = await reportService.getCashFlowStatement();

        expect(result.cashInflows.total.toNumber()).toBe(250);
        expect(result.cashOutflows.total.toNumber()).toBe(50);
        expect(result.netCashFlow.toNumber()).toBe(200);
    });
  });

  describe('getBalanceSheet', () => {
    it('should generate balance sheet', async () => {
        const mockInventory = [
            {
                quantity: new Prisma.Decimal(10),
                Product: { averageCostPrice: new Prisma.Decimal(10) },
            },
        ];
        const mockAR = [
            { balance: new Prisma.Decimal(50) },
        ];
        const mockAP = [
            { balance: new Prisma.Decimal(30) },
        ];

        vi.mocked(prisma.inventory.findMany).mockResolvedValue(mockInventory as any);
        vi.mocked(prisma.accountsReceivable.findMany).mockResolvedValue(mockAR as any);
        vi.mocked(prisma.accountsPayable.findMany).mockResolvedValue(mockAP as any);

        const result = await reportService.getBalanceSheet();

        expect(result.assets.inventoryValue.toNumber()).toBe(100);
        expect(result.assets.accountsReceivable.toNumber()).toBe(50);
        expect(result.assets.total.toNumber()).toBe(150);
        expect(result.liabilities.accountsPayable.toNumber()).toBe(30);
        expect(result.equity.toNumber()).toBe(120);
    });
  });
});
