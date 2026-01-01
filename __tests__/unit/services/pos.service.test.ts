import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POSService } from '@/services/pos.service';
import { posRepository } from '@/repositories/pos.repository';
import { inventoryService } from '@/services/inventory.service';
import { salesOrderService } from '@/services/sales-order.service';
import { prisma } from '@/lib/prisma';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { CreatePOSSaleInput } from '@/types/pos.types';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/repositories/pos.repository');
vi.mock('@/services/inventory.service');
vi.mock('@/services/sales-order.service');
vi.mock('@/services/product.service');

describe('POSService', () => {
  let posService: POSService;

  beforeEach(() => {
    vi.clearAllMocks();
    posService = new POSService();
  });

  describe('generateReceiptNumber', () => {
    it('should generate receipt number with format RCP-YYYYMMDD-0001 for first sale of the day', async () => {
      const mockDate = new Date('2024-03-15T14:30:00.000Z');
      vi.setSystemTime(mockDate);

      vi.mocked(posRepository.findAll).mockResolvedValue([]);

      const receiptNumber = await posService.generateReceiptNumber();

      expect(receiptNumber).toBe('RCP-20240315-0001');

      vi.useRealTimers();
    });

    it('should increment sequence number for subsequent sales on the same day', async () => {
      const mockDate = new Date('2024-03-15T14:30:00.000Z');
      vi.setSystemTime(mockDate);

      const existingSales = [
        {
          id: 'sale-1',
          receiptNumber: 'RCP-20240315-0001',
        } as any,
        {
          id: 'sale-2',
          receiptNumber: 'RCP-20240315-0002',
        } as any,
        {
          id: 'sale-3',
          receiptNumber: 'RCP-20240315-0003',
        } as any,
      ];

      vi.mocked(posRepository.findAll).mockResolvedValue(existingSales);

      const receiptNumber = await posService.generateReceiptNumber();

      expect(receiptNumber).toBe('RCP-20240315-0004');

      vi.useRealTimers();
    });

    it('should handle gaps in sequence numbers correctly', async () => {
      const mockDate = new Date('2024-03-15T14:30:00.000Z');
      vi.setSystemTime(mockDate);

      const existingSales = [
        {
          id: 'sale-1',
          receiptNumber: 'RCP-20240315-0001',
        } as any,
        {
          id: 'sale-2',
          receiptNumber: 'RCP-20240315-0005',
        } as any,
        {
          id: 'sale-3',
          receiptNumber: 'RCP-20240315-0003',
        } as any,
      ];

      vi.mocked(posRepository.findAll).mockResolvedValue(existingSales);

      const receiptNumber = await posService.generateReceiptNumber();

      // Should use max sequence (5) + 1
      expect(receiptNumber).toBe('RCP-20240315-0006');

      vi.useRealTimers();
    });

    it('should pad sequence number with zeros', async () => {
      const mockDate = new Date('2024-03-15T14:30:00.000Z');
      vi.setSystemTime(mockDate);

      const existingSales = Array.from({ length: 99 }, (_, i) => ({
        id: `sale-${i + 1}`,
        receiptNumber: `RCP-20240315-${String(i + 1).padStart(4, '0')}`,
      })) as any[];

      vi.mocked(posRepository.findAll).mockResolvedValue(existingSales);

      const receiptNumber = await posService.generateReceiptNumber();

      expect(receiptNumber).toBe('RCP-20240315-0100');

      vi.useRealTimers();
    });

    it('should reset sequence for new day', async () => {
      const mockDate = new Date('2024-03-16T00:00:00.000Z');
      vi.setSystemTime(mockDate);

      // No sales for the new day
      vi.mocked(posRepository.findAll).mockResolvedValue([]);

      const receiptNumber = await posService.generateReceiptNumber();

      expect(receiptNumber).toBe('RCP-20240316-0001');

      vi.useRealTimers();
    });
  });

  describe('getSaleById', () => {
    it('should throw NotFoundError when sale does not exist', async () => {
      vi.mocked(posRepository.findById).mockResolvedValue(null);

      await expect(posService.getSaleById('non-existent-id')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should return sale when it exists', async () => {
      const mockSale = {
        id: 'sale-1',
        receiptNumber: 'RCP-20240315-0001',
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        subtotal: 1000,
        taxAmount: 120,
        totalAmount: 1120,
        paymentMethod: 'cash',
        amountReceived: 1200,
        change: 80,
        items: [],
      } as any;

      vi.mocked(posRepository.findById).mockResolvedValue(mockSale);

      const result = await posService.getSaleById('sale-1');

      expect(result).toEqual(mockSale);
    });
  });

  describe('processSale', () => {
    it('should throw ValidationError when amount received is missing for cash payment', async () => {
      const saleData: CreatePOSSaleInput = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        subtotal: 1000,
        taxAmount: 120,
        totalAmount: 1120,
        paymentMethod: 'cash',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            uom: 'PIECE',
            unitPrice: 500,
            totalPrice: 1000,
          },
        ],
      };

      await expect(posService.processSale(saleData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when amount received is less than total for cash payment', async () => {
      const saleData: CreatePOSSaleInput = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        subtotal: 1000,
        taxAmount: 120,
        totalAmount: 1120,
        paymentMethod: 'cash',
        amountReceived: 1000, // Less than total
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            uom: 'PIECE',
            unitPrice: 500,
            totalPrice: 1000,
          },
        ],
      };

      await expect(posService.processSale(saleData)).rejects.toThrow(ValidationError);
    });

    it('should calculate change correctly for cash payment', async () => {
      const mockDate = new Date('2024-03-15T14:30:00.000Z');
      vi.setSystemTime(mockDate);

      const saleData: CreatePOSSaleInput = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        subtotal: 1000,
        taxAmount: 120,
        totalAmount: 1120,
        paymentMethod: 'cash',
        amountReceived: 1200,
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            uom: 'PIECE',
            unitPrice: 500,
            totalPrice: 1000,
          },
        ],
      };

      vi.mocked(posRepository.findAll).mockResolvedValue([]);
      vi.mocked(posRepository.findByReceiptNumber).mockResolvedValue(null);
      vi.mocked(inventoryService.calculateWeightedAverageCost).mockResolvedValue(400);
      vi.mocked(inventoryService.convertToBaseUOM).mockResolvedValue(2);
      vi.mocked(inventoryService.deductStock).mockResolvedValue(undefined);

      const createdSale = {
        id: 'sale-1',
        ...saleData,
        receiptNumber: 'RCP-20240315-0001',
        change: 80,
        items: [
          {
            ...saleData.items[0],
            costOfGoodsSold: 800,
          },
        ],
      } as any;

      vi.mocked(posRepository.create).mockResolvedValue(createdSale);

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({});
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      const result = await posService.processSale(saleData);

      expect(saleData.change).toBe(80);

      vi.useRealTimers();
    });

    it('should throw ValidationError when receipt number already exists', async () => {
      const mockDate = new Date('2024-03-15T14:30:00.000Z');
      vi.setSystemTime(mockDate);

      const saleData: CreatePOSSaleInput = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        subtotal: 1000,
        taxAmount: 120,
        totalAmount: 1120,
        paymentMethod: 'card',
        receiptNumber: 'RCP-20240315-0001',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            uom: 'PIECE',
            unitPrice: 500,
            totalPrice: 1000,
          },
        ],
      };

      const existingSale = {
        id: 'existing-sale',
        receiptNumber: 'RCP-20240315-0001',
      } as any;

      vi.mocked(posRepository.findByReceiptNumber).mockResolvedValue(existingSale);

      await expect(posService.processSale(saleData)).rejects.toThrow(ValidationError);

      vi.useRealTimers();
    });

    it('should calculate COGS and deduct inventory for each item', async () => {
      const mockDate = new Date('2024-03-15T14:30:00.000Z');
      vi.setSystemTime(mockDate);

      const saleData: CreatePOSSaleInput = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        subtotal: 1500,
        taxAmount: 180,
        totalAmount: 1680,
        paymentMethod: 'card',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            uom: 'PIECE',
            unitPrice: 500,
            totalPrice: 1000,
          },
          {
            productId: 'product-2',
            quantity: 1,
            uom: 'KILOGRAM',
            unitPrice: 500,
            totalPrice: 500,
          },
        ],
      };

      vi.mocked(posRepository.findAll).mockResolvedValue([]);
      vi.mocked(posRepository.findByReceiptNumber).mockResolvedValue(null);

      // Mock COGS calculation
      vi.mocked(inventoryService.calculateWeightedAverageCost)
        .mockResolvedValueOnce(400) // Product 1: $400/piece
        .mockResolvedValueOnce(350); // Product 2: $350/kg

      // Mock UOM conversion
      vi.mocked(inventoryService.convertToBaseUOM)
        .mockResolvedValueOnce(2) // Product 1: 2 pieces
        .mockResolvedValueOnce(1); // Product 2: 1 kg

      vi.mocked(inventoryService.deductStock).mockResolvedValue(undefined);

      const createdSale = {
        id: 'sale-1',
        ...saleData,
        receiptNumber: 'RCP-20240315-0001',
        items: [
          {
            ...saleData.items[0],
            costOfGoodsSold: 800, // 400 * 2
          },
          {
            ...saleData.items[1],
            costOfGoodsSold: 350, // 350 * 1
          },
        ],
      } as any;

      vi.mocked(posRepository.create).mockResolvedValue(createdSale);

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({});
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await posService.processSale(saleData);

      // Verify COGS calculated for both items
      expect(inventoryService.calculateWeightedAverageCost).toHaveBeenCalledTimes(2);
      expect(inventoryService.calculateWeightedAverageCost).toHaveBeenNthCalledWith(
        1,
        'product-1',
        'warehouse-1'
      );
      expect(inventoryService.calculateWeightedAverageCost).toHaveBeenNthCalledWith(
        2,
        'product-2',
        'warehouse-1'
      );

      // Verify inventory deducted for both items
      expect(inventoryService.deductStock).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should mark sales order as converted when convertedFromOrderId is provided', async () => {
      const mockDate = new Date('2024-03-15T14:30:00.000Z');
      vi.setSystemTime(mockDate);

      const saleData: CreatePOSSaleInput = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        subtotal: 1000,
        taxAmount: 120,
        totalAmount: 1120,
        paymentMethod: 'card',
        convertedFromOrderId: 'so-123',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            uom: 'PIECE',
            unitPrice: 500,
            totalPrice: 1000,
          },
        ],
      };

      vi.mocked(posRepository.findAll).mockResolvedValue([]);
      vi.mocked(posRepository.findByReceiptNumber).mockResolvedValue(null);
      vi.mocked(inventoryService.calculateWeightedAverageCost).mockResolvedValue(400);
      vi.mocked(inventoryService.convertToBaseUOM).mockResolvedValue(2);
      vi.mocked(inventoryService.deductStock).mockResolvedValue(undefined);
      vi.mocked(salesOrderService.markAsConverted).mockResolvedValue(undefined as any);

      const createdSale = {
        id: 'sale-1',
        ...saleData,
        receiptNumber: 'RCP-20240315-0001',
        items: [
          {
            ...saleData.items[0],
            costOfGoodsSold: 800,
          },
        ],
      } as any;

      vi.mocked(posRepository.create).mockResolvedValue(createdSale);

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({});
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await posService.processSale(saleData);

      // Verify sales order was marked as converted
      expect(salesOrderService.markAsConverted).toHaveBeenCalledWith('so-123', 'sale-1');

      vi.useRealTimers();
    });

    it('should process sale in a single transaction', async () => {
      const mockDate = new Date('2024-03-15T14:30:00.000Z');
      vi.setSystemTime(mockDate);

      const saleData: CreatePOSSaleInput = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        subtotal: 1000,
        taxAmount: 120,
        totalAmount: 1120,
        paymentMethod: 'card',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            uom: 'PIECE',
            unitPrice: 500,
            totalPrice: 1000,
          },
        ],
      };

      vi.mocked(posRepository.findAll).mockResolvedValue([]);
      vi.mocked(posRepository.findByReceiptNumber).mockResolvedValue(null);
      vi.mocked(inventoryService.calculateWeightedAverageCost).mockResolvedValue(400);
      vi.mocked(inventoryService.convertToBaseUOM).mockResolvedValue(2);
      vi.mocked(inventoryService.deductStock).mockResolvedValue(undefined);

      const createdSale = {
        id: 'sale-1',
        ...saleData,
        receiptNumber: 'RCP-20240315-0001',
        items: [
          {
            ...saleData.items[0],
            costOfGoodsSold: 800,
          },
        ],
      } as any;

      vi.mocked(posRepository.create).mockResolvedValue(createdSale);

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({});
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await posService.processSale(saleData);

      expect(mockTransaction).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should generate receipt number if not provided', async () => {
      const mockDate = new Date('2024-03-15T14:30:00.000Z');
      vi.setSystemTime(mockDate);

      const saleData: CreatePOSSaleInput = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        subtotal: 1000,
        taxAmount: 120,
        totalAmount: 1120,
        paymentMethod: 'card',
        // No receipt number provided
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            uom: 'PIECE',
            unitPrice: 500,
            totalPrice: 1000,
          },
        ],
      };

      vi.mocked(posRepository.findAll).mockResolvedValue([]);
      vi.mocked(posRepository.findByReceiptNumber).mockResolvedValue(null);
      vi.mocked(inventoryService.calculateWeightedAverageCost).mockResolvedValue(400);
      vi.mocked(inventoryService.convertToBaseUOM).mockResolvedValue(2);
      vi.mocked(inventoryService.deductStock).mockResolvedValue(undefined);

      const createdSale = {
        id: 'sale-1',
        ...saleData,
        receiptNumber: 'RCP-20240315-0001',
        items: [
          {
            ...saleData.items[0],
            costOfGoodsSold: 800,
          },
        ],
      } as any;

      vi.mocked(posRepository.create).mockResolvedValue(createdSale);

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({});
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await posService.processSale(saleData);

      // Verify receipt number was generated
      expect(saleData.receiptNumber).toBe('RCP-20240315-0001');

      vi.useRealTimers();
    });
  });

  describe('getActiveProductsWithStock', () => {
    it('should return products with current stock levels', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product A',
          description: 'Description A',
          category: 'Electronics',
          imageUrl: null,
          basePrice: 100,
          baseUOM: 'PIECE',
          status: 'active',
          alternateUOMs: [
            {
              id: 'uom-1',
              name: 'BOX',
              conversionFactor: 12,
              sellingPrice: 1100,
            },
          ],
          inventoryBatches: [
            { quantity: 50 },
            { quantity: 30 },
          ],
        },
        {
          id: 'product-2',
          name: 'Product B',
          description: 'Description B',
          category: 'Food',
          imageUrl: null,
          basePrice: 50,
          baseUOM: 'KILOGRAM',
          status: 'active',
          alternateUOMs: [],
          inventoryBatches: [
            { quantity: 100 },
          ],
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const result = await posService.getActiveProductsWithStock('warehouse-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'product-1',
        name: 'Product A',
        currentStock: 80, // 50 + 30
        inStock: true,
      });
      expect(result[1]).toMatchObject({
        id: 'product-2',
        name: 'Product B',
        currentStock: 100,
        inStock: true,
      });
    });

    it('should mark products with zero stock as not in stock', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product A',
          description: 'Description A',
          category: 'Electronics',
          imageUrl: null,
          basePrice: 100,
          baseUOM: 'PIECE',
          status: 'active',
          alternateUOMs: [],
          inventoryBatches: [], // No stock
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

      const result = await posService.getActiveProductsWithStock('warehouse-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'product-1',
        currentStock: 0,
        inStock: false,
      });
    });
  });
});
