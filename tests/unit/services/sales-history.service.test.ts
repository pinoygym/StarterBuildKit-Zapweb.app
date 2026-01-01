import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesHistoryService } from '@/services/sales-history.service';
import { prisma } from '@/lib/prisma';
import { DatePreset } from '@/types/sales-history.types';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pOSSale: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('SalesHistoryService', () => {
  let salesHistoryService: SalesHistoryService;

  beforeEach(() => {
    salesHistoryService = new SalesHistoryService();
    vi.clearAllMocks();
  });

  describe('getSalesHistory', () => {
    it('should return sales history with pagination', async () => {
      vi.mocked(prisma.pOSSale.count).mockResolvedValue(100);
      vi.mocked(prisma.pOSSale.findMany).mockResolvedValue([] as any);

      const result = await salesHistoryService.getSalesHistory({ page: 1, limit: 10 });

      expect(result.pagination.total).toBe(100);
      expect(prisma.pOSSale.count).toHaveBeenCalled();
      expect(prisma.pOSSale.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
      }));
    });

    it('should apply filters correctly', async () => {
      vi.mocked(prisma.pOSSale.count).mockResolvedValue(10);
      vi.mocked(prisma.pOSSale.findMany).mockResolvedValue([] as any);

      await salesHistoryService.getSalesHistory({
        branchId: 'branch-1',
        paymentMethod: 'cash',
        receiptNumber: 'REC-123',
        minAmount: 100,
        preset: DatePreset.TODAY,
      });

      expect(prisma.pOSSale.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          branchId: 'branch-1',
          paymentMethod: 'cash',
          receiptNumber: expect.objectContaining({ contains: 'REC-123' }),
          totalAmount: expect.objectContaining({ gte: 100 }),
          createdAt: expect.any(Object),
        }),
      }));
    });
  });

  describe('getAnalytics', () => {
    it('should generate analytics', async () => {
      const mockSales = [
        {
          totalAmount: 100,
          tax: 10,
          paymentMethod: 'cash',
          createdAt: new Date('2023-01-01'),
          POSSaleItem: [
            {
              productId: 'prod-1',
              quantity: 2,
              subtotal: 50,
              Product: { name: 'Product 1' },
            },
          ],
        },
        {
          totalAmount: 200,
          tax: 20,
          paymentMethod: 'credit',
          createdAt: new Date('2023-01-01'),
          POSSaleItem: [
            {
              productId: 'prod-1',
              quantity: 4,
              subtotal: 100,
              Product: { name: 'Product 1' },
            },
          ],
        },
      ];
      vi.mocked(prisma.pOSSale.findMany).mockResolvedValue(mockSales as any);

      const result = await salesHistoryService.getAnalytics({ preset: DatePreset.TODAY });

      expect(result.totalSales).toBe(300);
      expect(result.totalTransactions).toBe(2);
      expect(result.totalTax).toBe(30);
      expect(result.paymentMethodBreakdown.cash.count).toBe(1);
      expect(result.paymentMethodBreakdown.cash.amount).toBe(100);
      expect(result.paymentMethodBreakdown.credit.count).toBe(1);
      expect(result.paymentMethodBreakdown.credit.amount).toBe(200);
      expect(result.topProducts).toHaveLength(1);
      expect(result.topProducts[0].productId).toBe('prod-1');
      expect(result.topProducts[0].quantitySold).toBe(6);
    });
  });
});
