import { describe, it, expect, vi, beforeEach } from 'vitest';
import { alertService } from '@/services/alert.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    inventory: {
      findMany: vi.fn(),
    }
  }
}));

describe('AlertService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an alert', async () => {
    const input = {
      type: 'SYSTEM',
      title: 'Test Alert',
      message: 'Test Message'
    };

    (prisma.notification.create as any).mockResolvedValue({ id: '1', ...input });

    const result = await alertService.createAlert(input as any);
    expect(prisma.notification.create).toHaveBeenCalled();
    expect(result).toHaveProperty('id');
  });

  describe('checkLowStock', () => {
    it('detects low stock and creates alert', async () => {
      // Mock inventory data
      const mockInventory = [
        {
          quantity: 5,
          Product: {
            id: 'p1',
            name: 'Low Item',
            minStockLevel: 10,
            baseUOM: 'PCS',
            status: 'active'
          },
          Warehouse: { name: 'Main Warehouse' }
        }
      ];

      (prisma.inventory.findMany as any).mockResolvedValue(mockInventory);
      (prisma.notification.findFirst as any).mockResolvedValue(null); // No existing alert

      await alertService.checkLowStock();

      expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          type: 'LOW_STOCK',
          title: 'Low Stock Warning',
          message: expect.stringContaining('Low Item')
        })
      }));
    });

    it('prevents duplicate alerts', async () => {
      const mockInventory = [
        {
          quantity: 5,
          Product: {
            id: 'p1',
            name: 'Low Item',
            minStockLevel: 10,
            baseUOM: 'PCS',
            status: 'active'
          },
          Warehouse: { name: 'Main Warehouse' }
        }
      ];

      (prisma.inventory.findMany as any).mockResolvedValue(mockInventory);
      // Simulate existing alert
      (prisma.notification.findFirst as any).mockResolvedValue({ id: 'existing-alert' });

      await alertService.checkLowStock();

      // Should find existing, and thus NOT create new
      expect(prisma.notification.findFirst).toHaveBeenCalled();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });
});
