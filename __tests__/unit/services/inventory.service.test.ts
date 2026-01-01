import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryService } from '@/services/inventory.service';
import { inventoryRepository } from '@/repositories/inventory.repository';
import { productService } from '@/services/product.service';
import { prisma } from '@/lib/prisma';
import { ValidationError, InsufficientStockError, NotFoundError } from '@/lib/errors';
import { UnitOfMeasure } from '@prisma/client';
import {
  mockProducts,
  mockWarehouses,
  mockInventoryBatches,
  createMockBatch,
  mockProductUOMs,
} from '../../fixtures/test-data';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    inventoryBatch: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
    warehouse: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/repositories/inventory.repository');
vi.mock('@/services/product.service');

describe('InventoryService', () => {
  let inventoryService: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    inventoryService = new InventoryService();
  });

  describe('generateBatchNumber', () => {
    it('should generate batch number with format BATCH-YYYYMMDD-0001 for first batch of the day', async () => {
      const mockDate = new Date('2024-01-15T10:00:00.000Z');
      vi.setSystemTime(mockDate);

      vi.mocked(prisma.inventoryBatch.findFirst).mockResolvedValue(null);

      const batchNumber = await inventoryService.generateBatchNumber();

      expect(batchNumber).toBe('BATCH-20240115-0001');
      expect(prisma.inventoryBatch.findFirst).toHaveBeenCalledWith({
        where: {
          batchNumber: {
            startsWith: 'BATCH-20240115',
          },
        },
        orderBy: {
          batchNumber: 'desc',
        },
      });

      vi.useRealTimers();
    });

    it('should increment sequence number for subsequent batches on the same day', async () => {
      const mockDate = new Date('2024-01-15T10:00:00.000Z');
      vi.setSystemTime(mockDate);

      const lastBatch = {
        ...mockInventoryBatches.batch1,
        batchNumber: 'BATCH-20240115-0005',
      };

      vi.mocked(prisma.inventoryBatch.findFirst).mockResolvedValue(lastBatch);

      const batchNumber = await inventoryService.generateBatchNumber();

      expect(batchNumber).toBe('BATCH-20240115-0006');

      vi.useRealTimers();
    });

    it('should pad sequence number with zeros', async () => {
      const mockDate = new Date('2024-01-15T10:00:00.000Z');
      vi.setSystemTime(mockDate);

      const lastBatch = {
        ...mockInventoryBatches.batch1,
        batchNumber: 'BATCH-20240115-0099',
      };

      vi.mocked(prisma.inventoryBatch.findFirst).mockResolvedValue(lastBatch);

      const batchNumber = await inventoryService.generateBatchNumber();

      expect(batchNumber).toBe('BATCH-20240115-0100');

      vi.useRealTimers();
    });
  });

  describe('calculateWeightedAverageCost', () => {
    it('should return 0 when no batches exist', async () => {
      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue([]);

      const avgCost = await inventoryService.calculateWeightedAverageCost(
        'product-1',
        'warehouse-1'
      );

      expect(avgCost).toBe(0);
    });

    it('should calculate weighted average cost correctly with single batch', async () => {
      const batch = createMockBatch({
        quantity: 100,
        unitCost: 50.0,
      });

      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue([batch]);

      const avgCost = await inventoryService.calculateWeightedAverageCost(
        'product-1',
        'warehouse-1'
      );

      // (100 * 50) / 100 = 50
      expect(avgCost).toBe(50.0);
    });

    it('should calculate weighted average cost correctly with multiple batches', async () => {
      const batches = [
        createMockBatch({ quantity: 100, unitCost: 80.0 }),
        createMockBatch({ quantity: 50, unitCost: 85.0 }),
        createMockBatch({ quantity: 75, unitCost: 90.0 }),
      ];

      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(batches);

      const avgCost = await inventoryService.calculateWeightedAverageCost(
        'product-1',
        'warehouse-1'
      );

      // (100*80 + 50*85 + 75*90) / (100+50+75) = (8000 + 4250 + 6750) / 225 = 19000 / 225 = 84.44444...
      expect(avgCost).toBeCloseTo(84.44, 2);
    });

    it('should handle decimal quantities and costs', async () => {
      const batches = [
        createMockBatch({ quantity: 10.5, unitCost: 25.75 }),
        createMockBatch({ quantity: 15.25, unitCost: 30.5 }),
      ];

      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(batches);

      const avgCost = await inventoryService.calculateWeightedAverageCost(
        'product-1',
        'warehouse-1'
      );

      // (10.5*25.75 + 15.25*30.5) / (10.5+15.25) = (270.375 + 465.125) / 25.75 = 735.5 / 25.75 = 28.56...
      expect(avgCost).toBeCloseTo(28.56, 2);
    });

    it('should return 0 when total quantity is 0', async () => {
      const batches = [
        createMockBatch({ quantity: 0, unitCost: 50.0 }),
      ];

      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(batches);

      const avgCost = await inventoryService.calculateWeightedAverageCost(
        'product-1',
        'warehouse-1'
      );

      expect(avgCost).toBe(0);
    });
  });

  describe('convertToBaseUOM', () => {
    it('should return same quantity when already in base UOM', async () => {
      const product = {
        ...mockProducts.productA,
        baseUOM: 'PIECE',
        alternateUOMs: [],
      };

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);

      const result = await inventoryService.convertToBaseUOM('product-1', 100, 'PIECE');

      expect(result).toBe(100);
    });

    it('should convert from alternate UOM to base UOM correctly', async () => {
      const product = {
        ...mockProducts.productWithBox,
        baseUOM: 'PIECE',
        alternateUOMs: [
          {
            name: 'BOX',
            conversionFactor: 12, // 1 box = 12 pieces
          },
        ],
      };

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);

      const result = await inventoryService.convertToBaseUOM('product-3', 5, 'BOX');

      // 5 boxes * 12 pieces/box = 60 pieces
      expect(result).toBe(60);
    });

    it('should convert from smaller to larger base UOM (gram to kilogram)', async () => {
      const product = {
        ...mockProducts.productB,
        baseUOM: 'KILOGRAM',
        alternateUOMs: [
          {
            name: 'GRAM',
            conversionFactor: 0.001, // 1 gram = 0.001 kg
          },
        ],
      };

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);

      const result = await inventoryService.convertToBaseUOM('product-2', 500, 'GRAM');

      // 500 grams * 0.001 = 0.5 kg
      expect(result).toBe(0.5);
    });

    it('should throw ValidationError when UOM is invalid', async () => {
      const product = {
        ...mockProducts.productA,
        baseUOM: 'PIECE',
        alternateUOMs: [
          {
            name: 'BOX',
            conversionFactor: 12,
          },
        ],
      };

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);

      await expect(
        inventoryService.convertToBaseUOM('product-1', 100, 'INVALID_UOM')
      ).rejects.toThrow(ValidationError);
    });

    it('should be case-insensitive when comparing UOM names', async () => {
      const product = {
        ...mockProducts.productA,
        baseUOM: 'PIECE',
        alternateUOMs: [
          {
            name: 'BOX',
            conversionFactor: 12,
          },
        ],
      };

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);

      const result1 = await inventoryService.convertToBaseUOM('product-1', 5, 'box');
      const result2 = await inventoryService.convertToBaseUOM('product-1', 5, 'BOX');
      const result3 = await inventoryService.convertToBaseUOM('product-1', 5, 'Box');

      expect(result1).toBe(60);
      expect(result2).toBe(60);
      expect(result3).toBe(60);
    });
  });

  describe('getCurrentStockLevel', () => {
    it('should return 0 when no batches exist', async () => {
      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue([]);

      const stockLevel = await inventoryService.getCurrentStockLevel(
        'product-1',
        'warehouse-1'
      );

      expect(stockLevel).toBe(0);
    });

    it('should sum up quantities from all active batches', async () => {
      const batches = [
        createMockBatch({ quantity: 100 }),
        createMockBatch({ quantity: 50 }),
        createMockBatch({ quantity: 75 }),
      ];

      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(batches);

      const stockLevel = await inventoryService.getCurrentStockLevel(
        'product-1',
        'warehouse-1'
      );

      expect(stockLevel).toBe(225);
    });
  });

  describe('deductStock', () => {
    it('should throw ValidationError when quantity is zero or negative', async () => {
      const product = {
        ...mockProducts.productA,
        baseUOM: 'PIECE',
        alternateUOMs: [],
      };

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);

      await expect(
        inventoryService.deductStock({
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 0,
          uom: 'PIECE',
          reason: 'Test',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        inventoryService.deductStock({
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: -10,
          uom: 'PIECE',
          reason: 'Test',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw InsufficientStockError when not enough stock available', async () => {
      const product = {
        ...mockProducts.productA,
        baseUOM: 'PIECE',
        alternateUOMs: [],
        name: 'Test Product',
      };

      const batches = [
        createMockBatch({ quantity: 50 }),
      ];

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);
      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(batches);

      await expect(
        inventoryService.deductStock({
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 100,
          uom: 'PIECE',
          reason: 'Test',
        })
      ).rejects.toThrow(InsufficientStockError);
    });

    it('should deduct stock using FIFO (earliest expiry first)', async () => {
      const product = {
        ...mockProducts.productA,
        baseUOM: 'PIECE',
        alternateUOMs: [],
      };

      const batches = [
        createMockBatch({
          id: 'batch-1',
          quantity: 100,
          expiryDate: new Date('2025-03-31'), // Earliest expiry
        }),
        createMockBatch({
          id: 'batch-2',
          quantity: 50,
          expiryDate: new Date('2025-06-30'),
        }),
        createMockBatch({
          id: 'batch-3',
          quantity: 75,
          expiryDate: new Date('2025-12-31'), // Latest expiry
        }),
      ];

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);
      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(batches);

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({
          inventoryBatch: {
            update: vi.fn(),
          },
          stockMovement: {
            create: vi.fn(),
          },
        });
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await inventoryService.deductStock({
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 120, // Should take all from batch-1 (100) and 20 from batch-2
        uom: 'PIECE',
        reason: 'Test deduction',
      });

      expect(mockTransaction).toHaveBeenCalled();
      // Transaction should deduct from batches in FIFO order
    });

    it('should convert UOM before deducting', async () => {
      const product = {
        ...mockProducts.productWithBox,
        baseUOM: 'PIECE',
        alternateUOMs: [
          {
            name: 'BOX',
            conversionFactor: 12,
          },
        ],
      };

      const batches = [
        createMockBatch({ quantity: 150 }),
      ];

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);
      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(batches);

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({
          inventoryBatch: {
            update: vi.fn().mockResolvedValue({}),
          },
          stockMovement: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      // Deduct 5 boxes = 60 pieces
      await inventoryService.deductStock({
        productId: 'product-3',
        warehouseId: 'warehouse-1',
        quantity: 5,
        uom: 'BOX',
        reason: 'Test',
      });

      expect(mockTransaction).toHaveBeenCalled();
    });
  });

  describe('addStock', () => {
    it('should throw ValidationError when quantity is zero or negative', async () => {
      const product = {
        ...mockProducts.productA,
        baseUOM: 'PIECE',
        alternateUOMs: [],
        shelfLifeDays: 365,
      };

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);

      await expect(
        inventoryService.addStock({
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 0,
          uom: 'PIECE',
          unitCost: 50,
          reason: 'Test',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when unit cost is zero or negative', async () => {
      const product = {
        ...mockProducts.productA,
        baseUOM: 'PIECE',
        alternateUOMs: [],
        shelfLifeDays: 365,
      };

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);

      await expect(
        inventoryService.addStock({
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 100,
          uom: 'PIECE',
          unitCost: 0,
          reason: 'Test',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        inventoryService.addStock({
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 100,
          uom: 'PIECE',
          unitCost: -10,
          reason: 'Test',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should create batch with correct expiry date based on shelf life', async () => {
      const mockDate = new Date('2024-01-15T10:00:00.000Z');
      vi.setSystemTime(mockDate);

      const product = {
        ...mockProducts.productA,
        baseUOM: 'PIECE',
        alternateUOMs: [],
        shelfLifeDays: 90,
      };

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);
      vi.mocked(prisma.inventoryBatch.findFirst).mockResolvedValue(null);

      const newBatch = createMockBatch({
        batchNumber: 'BATCH-20240115-0001',
      });

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({
          inventoryBatch: {
            create: vi.fn().mockResolvedValue(newBatch),
          },
          stockMovement: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await inventoryService.addStock({
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 100,
        uom: 'PIECE',
        unitCost: 50,
        reason: 'Test',
      });

      expect(mockTransaction).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should convert UOM to base UOM before creating batch', async () => {
      const mockDate = new Date('2024-01-15T10:00:00.000Z');
      vi.setSystemTime(mockDate);

      const product = {
        ...mockProducts.productWithBox,
        baseUOM: 'PIECE',
        alternateUOMs: [
          {
            name: 'BOX',
            conversionFactor: 12,
          },
        ],
        shelfLifeDays: 365,
      };

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);
      vi.mocked(prisma.inventoryBatch.findFirst).mockResolvedValue(null);

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({
          inventoryBatch: {
            create: vi.fn().mockResolvedValue(createMockBatch()),
          },
          stockMovement: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      // Add 10 boxes = 120 pieces
      await inventoryService.addStock({
        productId: 'product-3',
        warehouseId: 'warehouse-1',
        quantity: 10,
        uom: 'BOX',
        unitCost: 50,
        reason: 'Test',
      });

      expect(mockTransaction).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('transferStock', () => {
    it('should throw ValidationError when source and destination are the same', async () => {
      await expect(
        inventoryService.transferStock({
          productId: 'product-1',
          sourceWarehouseId: 'warehouse-1',
          destinationWarehouseId: 'warehouse-1',
          quantity: 100,
          uom: 'PIECE',
          reason: 'Test',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw InsufficientStockError when source warehouse has insufficient stock', async () => {
      const product = {
        ...mockProducts.productA,
        baseUOM: 'PIECE',
        alternateUOMs: [],
        name: 'Test Product',
        shelfLifeDays: 365,
      };

      const batches = [
        createMockBatch({ quantity: 50 }),
      ];

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);
      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(batches);

      await expect(
        inventoryService.transferStock({
          productId: 'product-1',
          sourceWarehouseId: 'warehouse-1',
          destinationWarehouseId: 'warehouse-2',
          quantity: 100,
          uom: 'PIECE',
          reason: 'Test',
        })
      ).rejects.toThrow(InsufficientStockError);
    });

    it('should deduct from source and add to destination in single transaction', async () => {
      const mockDate = new Date('2024-01-15T10:00:00.000Z');
      vi.setSystemTime(mockDate);

      const product = {
        ...mockProducts.productA,
        baseUOM: 'PIECE',
        alternateUOMs: [],
        shelfLifeDays: 365,
      };

      const batches = [
        createMockBatch({
          id: 'batch-1',
          quantity: 150,
          unitCost: 50,
        }),
      ];

      vi.mocked(productService.getProductById).mockResolvedValue(product as any);
      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(batches);
      vi.mocked(prisma.inventoryBatch.findFirst).mockResolvedValue(null);

      let updateCallCount = 0;
      let createCallCount = 0;
      let movementCallCount = 0;

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({
          inventoryBatch: {
            update: vi.fn(() => {
              updateCallCount++;
              return Promise.resolve({});
            }),
            create: vi.fn(() => {
              createCallCount++;
              return Promise.resolve(createMockBatch());
            }),
          },
          stockMovement: {
            create: vi.fn(() => {
              movementCallCount++;
              return Promise.resolve({});
            }),
          },
        });
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await inventoryService.transferStock({
        productId: 'product-1',
        sourceWarehouseId: 'warehouse-1',
        destinationWarehouseId: 'warehouse-2',
        quantity: 100,
        uom: 'PIECE',
        reason: 'Transfer test',
      });

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(updateCallCount).toBe(1); // Update source batch
      expect(createCallCount).toBe(1); // Create destination batch
      expect(movementCallCount).toBe(2); // OUT and IN movements

      vi.useRealTimers();
    });
  });

  describe('getBatchById', () => {
    it('should throw NotFoundError when batch does not exist', async () => {
      vi.mocked(inventoryRepository.findBatchById).mockResolvedValue(null);

      await expect(
        inventoryService.getBatchById('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should return batch when it exists', async () => {
      const batch = createMockBatch({ id: 'batch-1' });

      vi.mocked(inventoryRepository.findBatchById).mockResolvedValue(batch as any);

      const result = await inventoryService.getBatchById('batch-1');

      expect(result).toEqual(batch);
    });
  });
});
