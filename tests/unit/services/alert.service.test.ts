import { describe, it, expect, vi, beforeEach } from 'vitest';
import { alertService } from '@/services/alert.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
  Prisma: {},
}));

describe('AlertService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLowStockAlerts', () => {
    it('should generate alert when stock is below minimum level', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Coca-Cola 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 100,
          status: 'active',
          Inventory: [
            {
              warehouseId: 'warehouse-1',
              quantity: 50, // Below minimum
              Warehouse: {
                id: 'warehouse-1',
                name: 'Main Warehouse',
                branchId: 'branch-1',
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const alerts = await alertService.getLowStockAlerts();

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'low_stock',
        severity: 'warning',
        productId: 'product-1',
        productName: 'Coca-Cola 1.5L',
        warehouseId: 'warehouse-1',
        warehouseName: 'Main Warehouse',
        currentStock: 50,
        minStockLevel: 100,
        shortageAmount: 50,
      });
      expect(alerts[0].details).toContain('below minimum');
    });

    it('should generate critical alert when stock is zero', async () => {
      const mockProducts = [
        {
          id: 'product-2',
          name: 'Pepsi 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 50,
          status: 'active',
          Inventory: [
            {
              warehouseId: 'warehouse-1',
              quantity: 0, // Out of stock
              Warehouse: {
                id: 'warehouse-1',
                name: 'Main Warehouse',
                branchId: 'branch-1',
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const alerts = await alertService.getLowStockAlerts();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('critical');
      expect(alerts[0].currentStock).toBe(0);
    });

    it('should not generate alert when stock is above minimum', async () => {
      const mockProducts = [
        {
          id: 'product-3',
          name: 'Sprite 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 100,
          status: 'active',
          Inventory: [
            {
              warehouseId: 'warehouse-1',
              quantity: 150, // Above minimum
              Warehouse: {
                id: 'warehouse-1',
                name: 'Main Warehouse',
                branchId: 'branch-1',
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const alerts = await alertService.getLowStockAlerts();

      expect(alerts).toHaveLength(0);
    });

    it('should aggregate inventory across same warehouse', async () => {
      const mockProducts = [
        {
          id: 'product-4',
          name: 'Mountain Dew 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 100,
          status: 'active',
          Inventory: [
            {
              warehouseId: 'warehouse-1',
              quantity: 30,
              Warehouse: {
                id: 'warehouse-1',
                name: 'Main Warehouse',
                branchId: 'branch-1',
              },
            },
            {
              warehouseId: 'warehouse-1',
              quantity: 40,
              Warehouse: {
                id: 'warehouse-1',
                name: 'Main Warehouse',
                branchId: 'branch-1',
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const alerts = await alertService.getLowStockAlerts();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].currentStock).toBe(70); // 30 + 40
      expect(alerts[0].shortageAmount).toBe(30); // 100 - 70
    });

    it('should generate separate alerts for different warehouses', async () => {
      const mockProducts = [
        {
          id: 'product-5',
          name: 'Fanta 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 100,
          status: 'active',
          Inventory: [
            {
              warehouseId: 'warehouse-1',
              quantity: 50,
              Warehouse: {
                id: 'warehouse-1',
                name: 'Main Warehouse',
                branchId: 'branch-1',
              },
            },
            {
              warehouseId: 'warehouse-2',
              quantity: 40,
              Warehouse: {
                id: 'warehouse-2',
                name: 'Secondary Warehouse',
                branchId: 'branch-1',
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const alerts = await alertService.getLowStockAlerts();

      expect(alerts).toHaveLength(2);
      expect(alerts[0].warehouseId).toBe('warehouse-1');
      expect(alerts[1].warehouseId).toBe('warehouse-2');
    });

    it('should filter by branch when branchId provided', async () => {
      const mockProducts = [
        {
          id: 'product-6',
          name: 'Royal 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 100,
          status: 'active',
          Inventory: [],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      await alertService.getLowStockAlerts('branch-1');

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            Inventory: expect.objectContaining({
              where: expect.objectContaining({
                Warehouse: expect.objectContaining({
                  branchId: 'branch-1',
                }),
              }),
            }),
          }),
        })
      );
    });

    it('should handle products with no inventory', async () => {
      const mockProducts = [
        {
          id: 'product-7',
          name: '7-Up 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 100,
          status: 'active',
          Inventory: [], // No inventory records
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const alerts = await alertService.getLowStockAlerts();

      expect(alerts).toHaveLength(0);
    });
  });

  describe('generateAlerts', () => {
    it('should combine all alert types', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Coca-Cola 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 100,
          status: 'active',
          Inventory: [
            {
              warehouseId: 'warehouse-1',
              quantity: 50,
              Warehouse: {
                id: 'warehouse-1',
                name: 'Main Warehouse',
                branchId: 'branch-1',
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const alerts = await alertService.generateAlerts();

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some((a) => a.type === 'low_stock')).toBe(true);
    });

    it('should filter by alert type', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Coca-Cola 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 100,
          status: 'active',
          Inventory: [
            {
              warehouseId: 'warehouse-1',
              quantity: 50,
              Warehouse: {
                id: 'warehouse-1',
                name: 'Main Warehouse',
                branchId: 'branch-1',
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const alerts = await alertService.generateAlerts({ type: 'low_stock' });

      expect(alerts.every((a) => a.type === 'low_stock')).toBe(true);
    });

    it('should filter by severity', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Coca-Cola 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 100,
          status: 'active',
          Inventory: [
            {
              warehouseId: 'warehouse-1',
              quantity: 0,
              Warehouse: {
                id: 'warehouse-1',
                name: 'Main Warehouse',
                branchId: 'branch-1',
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const alerts = await alertService.generateAlerts({ severity: 'critical' });

      expect(alerts.every((a) => a.severity === 'critical')).toBe(true);
    });
  });

  describe('getAlertCounts', () => {
    it('should return correct counts by alert type', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Coca-Cola 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 100,
          status: 'active',
          Inventory: [
            {
              warehouseId: 'warehouse-1',
              quantity: 50,
              Warehouse: {
                id: 'warehouse-1',
                name: 'Main Warehouse',
                branchId: 'branch-1',
              },
            },
          ],
        },
        {
          id: 'product-2',
          name: 'Pepsi 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 100,
          status: 'active',
          Inventory: [
            {
              warehouseId: 'warehouse-1',
              quantity: 20,
              Warehouse: {
                id: 'warehouse-1',
                name: 'Main Warehouse',
                branchId: 'branch-1',
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const counts = await alertService.getAlertCounts();

      expect(counts.lowStock).toBe(2);
      expect(counts.total).toBe(2);
      expect(counts.expiringSoon).toBe(0);
      expect(counts.expired).toBe(0);
    });

    it('should filter counts by branch', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Coca-Cola 1.5L',
          baseUOM: 'bottles',
          minStockLevel: 100,
          status: 'active',
          Inventory: [],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      await alertService.getAlertCounts('branch-1');

      expect(prisma.product.findMany).toHaveBeenCalled();
    });

    it('should handle no alerts', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      const counts = await alertService.getAlertCounts();

      expect(counts.total).toBe(0);
      expect(counts.lowStock).toBe(0);
      expect(counts.expiringSoon).toBe(0);
      expect(counts.expired).toBe(0);
    });
  });
});
