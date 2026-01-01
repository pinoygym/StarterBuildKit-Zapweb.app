import { describe, it, expect, vi, beforeEach } from 'vitest';
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
        warehouseId: 'clp1234567890123456789012',
        branchId: 'clp1234567890123456789012',
        deliveryDate: new Date(),
        items: [
          { 
            productId: 'clp1234567890123456789012', 
            quantity: 5, 
            uom: 'Bottle',
            unitPrice: 100, // Added unitPrice
            subtotal: 500   // Added subtotal to pass validation
          },
        ],
      };

      vi.mocked(salesOrderRepository.findAll).mockResolvedValue([]);
      vi.mocked(salesOrderRepository.findByOrderNumber).mockResolvedValue(null);
      vi.mocked(inventoryService.convertToBaseUOM).mockResolvedValue(5);
      vi.mocked(inventoryService.getCurrentStockLevel).mockResolvedValue(10);
      vi.mocked(productService.getUOMSellingPrice).mockResolvedValue(100);
      vi.mocked(salesOrderRepository.create).mockResolvedValue({ id: 'so-1', ...input } as any);

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

      vi.mocked(salesOrderRepository.findAll).mockResolvedValue([]);
      vi.mocked(inventoryService.convertToBaseUOM).mockResolvedValue(20);
      vi.mocked(inventoryService.getCurrentStockLevel).mockResolvedValue(10);
      vi.mocked(productService.getProductById).mockResolvedValue({ name: 'Test Product' } as any);

      await expect(service.createSalesOrder(input as any)).rejects.toThrow();
    });
  });
});