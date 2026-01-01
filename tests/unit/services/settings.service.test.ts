import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsService } from '@/services/settings.service';
import { prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => await callback({
      $executeRawUnsafe: vi.fn().mockResolvedValue(10),
      salesOrder: { deleteMany: vi.fn().mockResolvedValue({ count: 5 }) },
      accountsReceivable: { deleteMany: vi.fn().mockResolvedValue({ count: 3 }) },
      pOSReceipt: { updateMany: vi.fn() },
      promotionUsage: { updateMany: vi.fn() },
      customer: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
    })),
    $queryRawUnsafe: vi.fn(),
    customer: { findMany: vi.fn() },
  },
}));

describe('SettingsService', () => {
  let settingsService: SettingsService;

  beforeEach(() => {
    settingsService = new SettingsService();
    vi.clearAllMocks();
  });

  describe('clearDatabase', () => {
    it('should clear database tables', async () => {
      const result = await settingsService.clearDatabase();

      expect(result.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('deleteTransactions', () => {
    it('should delete transactions', async () => {
      const result = await settingsService.deleteTransactions();

      expect(result.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getDatabaseStats', () => {
    it('should return database stats', async () => {
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([{ count: BigInt(100) }] as any);

      const result = await settingsService.getDatabaseStats();

      expect(result.totalRecords).toBeGreaterThan(0);
      expect(result.tableStats).toHaveLength(result.totalTables);
      expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.$queryRawUnsafe).mockRejectedValue(new Error('DB Error'));

      const result = await settingsService.getDatabaseStats();

      expect(result.totalRecords).toBe(0);
      expect(result.tableStats.every(stat => stat.recordCount === 0)).toBe(true);
    });
  });

  describe('cleanupTestCustomers', () => {
    it('should clean up test customers', async () => {
      vi.mocked(prisma.customer.findMany).mockResolvedValue([{ id: 'cust-1' }] as any);

      const result = await settingsService.cleanupTestCustomers();

      expect(result.success).toBe(true);
      expect(result.recordsDeleted).toBeGreaterThan(0);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.customer.findMany).toHaveBeenCalled();
    });

    it('should return early if no test customers found', async () => {
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      const result = await settingsService.cleanupTestCustomers();

      expect(result.success).toBe(true);
      expect(result.message).toBe('No test customers found.');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
