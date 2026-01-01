import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync } from 'fs';
import { SalesOrderService } from '@/services/sales-order.service';
import { salesOrderRepository } from '@/repositories/sales-order.repository';
import { inventoryService } from '@/services/inventory.service';
import { productService } from '@/services/product.service';

// Mock dependencies
vi.mock('@/repositories/sales-order.repository', () => ({
  salesOrderRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findPendingOrders: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findByOrderNumber: vi.fn(),
    updateStatus: vi.fn(),
    markAsConverted: vi.fn(),
    countActiveOrders: vi.fn(),
    calculateConversionRate: vi.fn(),
  },
}));

vi.mock('@/services/inventory.service', () => ({
  inventoryService: {
    convertToBaseUOM: vi.fn(),
    getCurrentStockLevel: vi.fn(),
  },
}));

vi.mock('@/services/product.service', () => ({
  productService: {
    getProductById: vi.fn(),
    getUOMSellingPrice: vi.fn(),
  },
}));

describe('SalesOrderService', () => {
  let service: SalesOrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SalesOrderService();
  });

  describe('createSalesOrder', () => {
    it('should create a sales order successfully', async () => {
      const input = {
        customerName: 'John Doe',
        customerPhone: '09171234567',
        deliveryAddress: '123 Main St',
        warehouseId: 'clp123456789012345678901234', // 25 chars starting with c
        branchId: 'clp123456789012345678901234',
        deliveryDate: new Date(),
        items: [
          {
            productId: 'clp123456789012345678901234',
            quantity: 5,
            uom: 'Bottle',
            unitPrice: 100,
            subtotal: 500
          },
        ],
      };

      (salesOrderRepository.findAll as any).mockResolvedValue([]);
      (salesOrderRepository.findByOrderNumber as any).mockResolvedValue(null);
      (inventoryService.convertToBaseUOM as any).mockResolvedValue(5);
      (inventoryService.getCurrentStockLevel as any).mockResolvedValue(10);
      (productService.getUOMSellingPrice as any).mockResolvedValue(100);
      (salesOrderRepository.create as any).mockResolvedValue({ id: 'so-1', ...input });

      const result = await service.createSalesOrder(input as any);

      expect(salesOrderRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if insufficient stock', async () => {
      const input = {
        customerName: 'John Doe',
        customerPhone: '09171234567',
        deliveryAddress: '123 Main St',
        warehouseId: 'clp1234567890123456789012',
        branchId: 'clp1234567890123456789012',
        deliveryDate: new Date(),
        items: [
          {
            productId: 'clp1234567890123456789012',
            quantity: 20,
            uom: 'Bottle',
            unitPrice: 100,
            subtotal: 2000
          },
        ],
      };

      (salesOrderRepository.findAll as any).mockResolvedValue([]);
      (inventoryService.convertToBaseUOM as any).mockResolvedValue(20);
      (inventoryService.getCurrentStockLevel as any).mockResolvedValue(10);
      (productService.getProductById as any).mockResolvedValue({ name: 'Test Product' } as any);

      await expect(service.createSalesOrder(input as any)).rejects.toThrow();
    });
  });
});