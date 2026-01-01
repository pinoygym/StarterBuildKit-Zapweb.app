import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryService } from '@/services/inventory.service';
import { inventoryRepository } from '@/repositories/inventory.repository';
import { productService } from '@/services/product.service';
import { DatabaseTestBase, TestUtils } from '@/tests/helpers/test-base';
import { ValidationError, NotFoundError, InsufficientStockError } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';

// Mock repositories and services
vi.mock('@/repositories/inventory.repository');
vi.mock('@/services/product.service');

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    inventoryBatch: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
    warehouse: {
      findUnique: vi.fn(),
    },
  },
}));

describe('InventoryService', () => {
  let inventoryService: InventoryService;
  let dbTestBase: DatabaseTestBase;
  let testProductId: string;
  let testWarehouseId: string;
  let testBatchId: string;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Initialize database test base
    dbTestBase = new DatabaseTestBase();
    await dbTestBase.setup();

    // Create test IDs
    testProductId = TestUtils.generate.id();
    testWarehouseId = TestUtils.generate.id();
    testBatchId = TestUtils.generate.id();

    // Initialize service
    inventoryService = new InventoryService();
  });

  afterEach(async () => {
    await dbTestBase.teardown();
  });

  describe('generateBatchNumber', () => {
    it('should generate batch number for new day', async () => {
      const { prisma } = await import('@/lib/prisma');
      const mockFindFirst = vi.mocked(prisma.inventoryBatch.findFirst);
      mockFindFirst.mockResolvedValue(null);

      const result = await inventoryService.generateBatchNumber();

      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      expect(result).toMatch(new RegExp(`^BATCH-${today}-0001$`));
    });

    it('should increment sequence for existing batches on same day', async () => {
      const { prisma } = await import('@/lib/prisma');
      const mockFindFirst = vi.mocked(prisma.inventoryBatch.findFirst);

      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      mockFindFirst.mockResolvedValue({
        batchNumber: `BATCH-${today}-0005`,
      } as any);

      const result = await inventoryService.generateBatchNumber();

      expect(result).toBe(`BATCH-${today}-0006`);
    });

    it('should handle transaction context', async () => {
      const mockTx = { findFirst: vi.fn() };
      mockTx.findFirst.mockResolvedValue(null);

      const result = await inventoryService.generateBatchNumber(mockTx);

      expect(mockTx.findFirst).toHaveBeenCalled();
      expect(result).toMatch(/^BATCH-\d{8}-0001$/);
    });
  });

  describe('calculateWeightedAverageCost', () => {
    it('should calculate weighted average cost correctly', async () => {
      const mockBatches = [
        { quantity: new Decimal(100), unitCost: new Decimal(10) }, // 100 * 10 = 1000
        { quantity: new Decimal(200), unitCost: new Decimal(15) }, // 200 * 15 = 3000
        { quantity: new Decimal(50), unitCost: new Decimal(20) },  // 50 * 20 = 1000
      ]; // Total: 350 units, 5000 cost, Average: 14.2857

      const mockFindActiveBatches = vi.mocked(inventoryRepository.findActiveBatches);
      mockFindActiveBatches.mockResolvedValue(mockBatches as any);

      const result = await inventoryService.calculateWeightedAverageCost(testProductId, testWarehouseId);

      expect(mockFindActiveBatches).toHaveBeenCalledWith(testProductId, testWarehouseId);
      expect(result).toBeCloseTo(14.2857, 4);
    });

    it('should return 0 when no batches exist', async () => {
      const mockFindActiveBatches = vi.mocked(inventoryRepository.findActiveBatches);
      mockFindActiveBatches.mockResolvedValue([]);

      const result = await inventoryService.calculateWeightedAverageCost(testProductId, testWarehouseId);

      expect(result).toBe(0);
    });
  });

  describe('convertToBaseUOM', () => {
    it('should return quantity as-is for base UOM', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        alternateUOMs: [],
      };

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      const result = await inventoryService.convertToBaseUOM(testProductId, 100, 'PCS');

      expect(result).toBe(100);
    });

    it('should convert using alternate UOM conversion factor', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        alternateUOMs: [
          { name: 'BOX', conversionFactor: 10 },
        ],
      };

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      const result = await inventoryService.convertToBaseUOM(testProductId, 5, 'BOX');

      expect(result).toBe(50); // 5 boxes * 10 pcs/box = 50 pcs
    });

    it('should throw error for invalid UOM', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        alternateUOMs: [],
      };

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      await expect(
        inventoryService.convertToBaseUOM(testProductId, 100, 'INVALID')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getCurrentStockLevel', () => {
    it('should return total quantity from all active batches', async () => {
      const mockBatches = [
        { quantity: new Decimal(100) },
        { quantity: new Decimal(250) },
        { quantity: new Decimal(75) },
      ];

      const mockFindActiveBatches = vi.mocked(inventoryRepository.findActiveBatches);
      mockFindActiveBatches.mockResolvedValue(mockBatches as any);

      const result = await inventoryService.getCurrentStockLevel(testProductId, testWarehouseId);

      expect(result).toBe(425);
    });

    it('should return 0 when no batches exist', async () => {
      const mockFindActiveBatches = vi.mocked(inventoryRepository.findActiveBatches);
      mockFindActiveBatches.mockResolvedValue([]);

      const result = await inventoryService.getCurrentStockLevel(testProductId, testWarehouseId);

      expect(result).toBe(0);
    });
  });

  describe('addStock', () => {
    const addStockData = {
      productId: testProductId,
      warehouseId: testWarehouseId,
      quantity: 100,
      uom: 'PCS',
      unitCost: 15.50,
      reason: 'Purchase Order',
      referenceId: 'PO-001',
      referenceType: 'PURCHASE_ORDER',
    };

    it('should add stock successfully', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        shelfLifeDays: 365,
        alternateUOMs: [],
      };

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockCreateBatch = vi.mocked(prisma.inventoryBatch.create);
      const mockCreateMovement = vi.mocked(prisma.stockMovement.create);

      const mockBatch = {
        id: testBatchId,
        batchNumber: 'BATCH-20241201-0001',
        productId: testProductId,
        warehouseId: testWarehouseId,
        quantity: 100,
        unitCost: 15.50,
        receivedDate: new Date(),
        expiryDate: new Date(),
        status: 'active',
      };

      mockTransaction.mockImplementation(async (callback) => {
        mockCreateBatch.mockResolvedValue(mockBatch as any);
        mockCreateMovement.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      const result = await inventoryService.addStock(addStockData);

      expect(mockGetProductById).toHaveBeenCalledWith(testProductId);
      expect(mockCreateBatch).toHaveBeenCalledWith({
        data: expect.objectContaining({
          batchNumber: expect.stringMatching(/^BATCH-\d{8}-\d{4}$/),
          productId: testProductId,
          warehouseId: testWarehouseId,
          quantity: 100,
          unitCost: 15.50,
          status: 'active',
        }),
      });
      expect(mockCreateMovement).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'IN',
          quantity: 100,
          reason: 'Purchase Order',
          referenceId: 'PO-001',
          referenceType: 'PURCHASE_ORDER',
        }),
      });
      expect(result).toEqual(mockBatch);
    });

    it('should convert quantity to base UOM', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        shelfLifeDays: 365,
        alternateUOMs: [
          { name: 'BOX', conversionFactor: 10 },
        ],
      };

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockCreateBatch = vi.mocked(prisma.inventoryBatch.create);
      const mockCreateMovement = vi.mocked(prisma.stockMovement.create);

      mockTransaction.mockImplementation(async (callback) => {
        mockCreateBatch.mockResolvedValue({} as any);
        mockCreateMovement.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await inventoryService.addStock({
        ...addStockData,
        quantity: 5,
        uom: 'BOX',
      });

      expect(mockCreateBatch).toHaveBeenCalledWith({
        data: expect.objectContaining({
          quantity: 50, // 5 boxes * 10 pcs/box
        }),
      });
    });

    it('should throw error for invalid quantity', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        alternateUOMs: [],
      };

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      await expect(
        inventoryService.addStock({
          ...addStockData,
          quantity: 0,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid unit cost', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        alternateUOMs: [],
      };

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      await expect(
        inventoryService.addStock({
          ...addStockData,
          unitCost: 0,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deductStock', () => {
    const deductStockData = {
      productId: testProductId,
      warehouseId: testWarehouseId,
      quantity: 50,
      uom: 'PCS',
      reason: 'Sale',
      referenceId: 'SALE-001',
      referenceType: 'SALES_ORDER',
    };

    it('should deduct stock using FIFO successfully', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        alternateUOMs: [],
      };

      const mockBatches = [
        { id: 'batch1', quantity: new Decimal(30), expiryDate: new Date('2024-12-01') },
        { id: 'batch2', quantity: new Decimal(40), expiryDate: new Date('2024-12-15') },
        { id: 'batch3', quantity: new Decimal(60), expiryDate: new Date('2024-12-30') },
      ];

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      const mockFindActiveBatches = vi.mocked(inventoryRepository.findActiveBatches);
      mockFindActiveBatches.mockResolvedValue(mockBatches as any);

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockUpdateBatch = vi.mocked(prisma.inventoryBatch.update);
      const mockCreateMovement = vi.mocked(prisma.stockMovement.create);

      mockTransaction.mockImplementation(async (callback) => {
        mockUpdateBatch.mockResolvedValue({} as any);
        mockCreateMovement.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await inventoryService.deductStock(deductStockData);

      // Should deduct 30 from first batch (depleting it) and 20 from second batch
      expect(mockUpdateBatch).toHaveBeenCalledTimes(2);
      expect(mockUpdateBatch).toHaveBeenNthCalledWith(1, {
        where: { id: 'batch1' },
        data: { quantity: 0, status: 'depleted' },
      });
      expect(mockUpdateBatch).toHaveBeenNthCalledWith(2, {
        where: { id: 'batch2' },
        data: { quantity: 20, status: 'active' },
      });

      expect(mockCreateMovement).toHaveBeenCalledTimes(2);
    });

    it('should throw InsufficientStockError when not enough stock', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        alternateUOMs: [],
      };

      const mockBatches = [
        { id: 'batch1', quantity: new Decimal(30) },
      ];

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      const mockFindActiveBatches = vi.mocked(inventoryRepository.findActiveBatches);
      mockFindActiveBatches.mockResolvedValue(mockBatches as any);

      await expect(
        inventoryService.deductStock({
          ...deductStockData,
          quantity: 100, // More than available
        })
      ).rejects.toThrow(InsufficientStockError);
    });
  });

  describe('transferStock', () => {
    const transferData = {
      productId: testProductId,
      sourceWarehouseId: testWarehouseId,
      destinationWarehouseId: TestUtils.generate.id(),
      quantity: 25,
      uom: 'PCS',
      reason: 'Warehouse Transfer',
    };

    it('should transfer stock between warehouses successfully', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        shelfLifeDays: 365,
        alternateUOMs: [],
      };

      const mockBatches = [
        { id: 'batch1', quantity: new Decimal(30), unitCost: new Decimal(10) },
      ];

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      const mockFindActiveBatches = vi.mocked(inventoryRepository.findActiveBatches);
      mockFindActiveBatches.mockResolvedValue(mockBatches as any);

      const mockCalculateWeightedAverageCost = vi.mocked(inventoryService.calculateWeightedAverageCost);
      mockCalculateWeightedAverageCost.mockResolvedValue(10);

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockUpdateBatch = vi.mocked(prisma.inventoryBatch.update);
      const mockCreateBatch = vi.mocked(prisma.inventoryBatch.create);
      const mockCreateMovement = vi.mocked(prisma.stockMovement.create);

      mockTransaction.mockImplementation(async (callback) => {
        mockUpdateBatch.mockResolvedValue({} as any);
        mockCreateBatch.mockResolvedValue({} as any);
        mockCreateMovement.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await inventoryService.transferStock(transferData);

      expect(mockUpdateBatch).toHaveBeenCalledWith({
        where: { id: 'batch1' },
        data: { quantity: 5, status: 'active' }, // 30 - 25 = 5
      });

      expect(mockCreateBatch).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: testProductId,
          warehouseId: transferData.destinationWarehouseId,
          quantity: 25,
          unitCost: 10,
          status: 'active',
        }),
      });

      expect(mockCreateMovement).toHaveBeenCalledTimes(2); // OUT and IN movements
    });

    it('should throw error when source and destination warehouses are the same', async () => {
      await expect(
        inventoryService.transferStock({
          ...transferData,
          destinationWarehouseId: testWarehouseId, // Same as source
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('adjustStock', () => {
    const adjustData = {
      batchId: testBatchId,
      newQuantity: 75,
      reason: 'Inventory Count Adjustment',
    };

    it('should adjust stock quantity successfully', async () => {
      const mockBatch = {
        id: testBatchId,
        quantity: new Decimal(100),
        status: 'active',
      };

      const mockFindBatchById = vi.mocked(inventoryRepository.findBatchById);
      mockFindBatchById.mockResolvedValue(mockBatch as any);

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockUpdateBatch = vi.mocked(prisma.inventoryBatch.update);
      const mockCreateMovement = vi.mocked(prisma.stockMovement.create);

      mockTransaction.mockImplementation(async (callback) => {
        mockUpdateBatch.mockResolvedValue({} as any);
        mockCreateMovement.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await inventoryService.adjustStock(adjustData);

      expect(mockUpdateBatch).toHaveBeenCalledWith({
        where: { id: testBatchId },
        data: { quantity: 75, status: 'active' },
      });

      expect(mockCreateMovement).toHaveBeenCalledWith({
        data: expect.objectContaining({
          batchId: testBatchId,
          type: 'ADJUSTMENT',
          quantity: 25, // |100 - 75|
          reason: 'Inventory Count Adjustment',
        }),
      });
    });

    it('should mark batch as depleted when quantity becomes zero', async () => {
      const mockBatch = {
        id: testBatchId,
        quantity: new Decimal(50),
        status: 'active',
      };

      const mockFindBatchById = vi.mocked(inventoryRepository.findBatchById);
      mockFindBatchById.mockResolvedValue(mockBatch as any);

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockUpdateBatch = vi.mocked(prisma.inventoryBatch.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockUpdateBatch.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await inventoryService.adjustStock({
        ...adjustData,
        newQuantity: 0,
      });

      expect(mockUpdateBatch).toHaveBeenCalledWith({
        where: { id: testBatchId },
        data: { quantity: 0, status: 'depleted' },
      });
    });

    it('should throw error when batch not found', async () => {
      const mockFindBatchById = vi.mocked(inventoryRepository.findBatchById);
      mockFindBatchById.mockResolvedValue(null);

      await expect(
        inventoryService.adjustStock(adjustData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error for negative quantity', async () => {
      const mockBatch = {
        id: testBatchId,
        quantity: new Decimal(100),
        status: 'active',
      };

      const mockFindBatchById = vi.mocked(inventoryRepository.findBatchById);
      mockFindBatchById.mockResolvedValue(mockBatch as any);

      await expect(
        inventoryService.adjustStock({
          ...adjustData,
          newQuantity: -10,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getStockLevels', () => {
    it('should return stock levels for all products and warehouses', async () => {
      const mockBatches = [
        {
          productId: testProductId,
          warehouseId: testWarehouseId,
          quantity: new Decimal(100),
          unitCost: new Decimal(15),
          expiryDate: new Date(),
          status: 'active',
          batchNumber: 'BATCH-001',
          Product: { id: testProductId, name: 'Test Product', baseUOM: 'PCS' },
          Warehouse: { id: testWarehouseId, name: 'Test Warehouse' },
        },
      ];

      const { prisma } = await import('@/lib/prisma');
      const mockFindMany = vi.mocked(prisma.inventoryBatch.findMany);
      mockFindMany.mockResolvedValue(mockBatches as any);

      const result = await inventoryService.getStockLevels();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        productId: testProductId,
        productName: 'Test Product',
        warehouseId: testWarehouseId,
        warehouseName: 'Test Warehouse',
        totalQuantity: 100,
        baseUOM: 'PCS',
        weightedAverageCost: 15,
        batches: [
          {
            batchNumber: 'BATCH-001',
            quantity: 100,
            unitCost: 15,
            expiryDate: mockBatches[0].expiryDate,
            status: 'active',
          },
        ],
      });
    });

    it('should filter by warehouse when specified', async () => {
      const { prisma } = await import('@/lib/prisma');
      const mockFindMany = vi.mocked(prisma.inventoryBatch.findMany);
      mockFindMany.mockResolvedValue([]);

      await inventoryService.getStockLevels(testWarehouseId);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          warehouseId: testWarehouseId,
        },
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });
    });
  });

  describe('getStockLevel', () => {
    it('should return stock level for specific product and warehouse', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
      };

      const mockBatches = [
        {
          batchNumber: 'BATCH-001',
          quantity: new Decimal(100),
          unitCost: new Decimal(15),
          expiryDate: new Date(),
          status: 'active',
        },
      ];

      const mockWarehouse = { name: 'Test Warehouse' };

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      const mockFindActiveBatches = vi.mocked(inventoryRepository.findActiveBatches);
      mockFindActiveBatches.mockResolvedValue(mockBatches as any);

      const mockCalculateWeightedAverageCost = vi.mocked(inventoryService.calculateWeightedAverageCost);
      mockCalculateWeightedAverageCost.mockResolvedValue(15);

      const { prisma } = await import('@/lib/prisma');
      const mockFindUnique = vi.mocked(prisma.warehouse.findUnique);
      mockFindUnique.mockResolvedValue(mockWarehouse as any);

      const result = await inventoryService.getStockLevel(testProductId, testWarehouseId);

      expect(result).toEqual({
        productId: testProductId,
        productName: 'Test Product',
        warehouseId: testWarehouseId,
        warehouseName: 'Test Warehouse',
        totalQuantity: 100,
        baseUOM: 'PCS',
        weightedAverageCost: 15,
        batches: mockBatches.map(batch => ({
          batchNumber: batch.batchNumber,
          quantity: Number(batch.quantity),
          unitCost: Number(batch.unitCost),
          expiryDate: batch.expiryDate,
          status: batch.status,
        })),
      });
    });

    it('should return null when no stock exists', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
      };

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      const mockFindActiveBatches = vi.mocked(inventoryRepository.findActiveBatches);
      mockFindActiveBatches.mockResolvedValue([]);

      const result = await inventoryService.getStockLevel(testProductId, testWarehouseId);

      expect(result).toBeNull();
    });
  });

  describe('markExpiredBatches', () => {
    it('should mark expired batches and return count', async () => {
      const mockExpiredBatches = [
        { id: 'batch1', expiryDate: new Date('2024-01-01') },
        { id: 'batch2', expiryDate: new Date('2024-01-15') },
      ];

      const { prisma } = await import('@/lib/prisma');
      const mockFindMany = vi.mocked(prisma.inventoryBatch.findMany);
      const mockUpdate = vi.mocked(prisma.inventoryBatch.update);

      mockFindMany.mockResolvedValue(mockExpiredBatches as any);
      mockUpdate.mockResolvedValue({} as any);

      const result = await inventoryService.markExpiredBatches();

      expect(result).toBe(2);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'batch1' },
        data: { status: 'expired' },
      });
    });
  });

  describe('getExpiringBatches', () => {
    it('should return batches expiring within specified days', async () => {
      const mockBatches = [
        { id: 'batch1', expiryDate: new Date() },
      ];

      const mockGetExpiringBatches = vi.mocked(inventoryRepository.getExpiringBatches);
      mockGetExpiringBatches.mockResolvedValue(mockBatches as any);

      const result = await inventoryService.getExpiringBatches(30);

      expect(mockGetExpiringBatches).toHaveBeenCalledWith(30);
      expect(result).toEqual(mockBatches);
    });
  });

  describe('getExpiredBatches', () => {
    it('should return expired batches', async () => {
      const mockBatches = [
        { id: 'batch1', expiryDate: new Date('2024-01-01') },
      ];

      const mockGetExpiredBatches = vi.mocked(inventoryRepository.getExpiredBatches);
      mockGetExpiredBatches.mockResolvedValue(mockBatches as any);

      const result = await inventoryService.getExpiredBatches();

      expect(mockGetExpiredBatches).toHaveBeenCalled();
      expect(result).toEqual(mockBatches);
    });
  });

  describe('Inventory Business Logic', () => {
    it('should handle FIFO correctly in complex scenarios', async () => {
      const mockBatches = [
        { id: 'batch1', quantity: new Decimal(10), expiryDate: new Date('2024-12-01') },
        { id: 'batch2', quantity: new Decimal(20), expiryDate: new Date('2024-11-15') }, // Expires first
        { id: 'batch3', quantity: new Decimal(30), expiryDate: new Date('2024-12-15') },
      ];

      const mockFindActiveBatches = vi.mocked(inventoryRepository.findActiveBatches);
      mockFindActiveBatches.mockResolvedValue(mockBatches as any);

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockUpdateBatch = vi.mocked(prisma.inventoryBatch.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockUpdateBatch.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      // Deduct 25 units - should take 20 from batch2 and 5 from batch1
      await inventoryService.deductStock({
        productId: testProductId,
        warehouseId: testWarehouseId,
        quantity: 25,
        uom: 'PCS',
        reason: 'Sale',
      });

      expect(mockUpdateBatch).toHaveBeenCalledTimes(2);
      expect(mockUpdateBatch).toHaveBeenNthCalledWith(1, {
        where: { id: 'batch2' },
        data: { quantity: 0, status: 'depleted' },
      });
      expect(mockUpdateBatch).toHaveBeenNthCalledWith(2, {
        where: { id: 'batch1' },
        data: { quantity: 5, status: 'active' },
      });
    });

    it('should calculate weighted average cost with precision', async () => {
      const mockBatches = [
        { quantity: new Decimal(100.5), unitCost: new Decimal(10.25) },
        { quantity: new Decimal(200.75), unitCost: new Decimal(15.50) },
      ];

      const mockFindActiveBatches = vi.mocked(inventoryRepository.findActiveBatches);
      mockFindActiveBatches.mockResolvedValue(mockBatches as any);

      const result = await inventoryService.calculateWeightedAverageCost(testProductId, testWarehouseId);

      // (100.5 * 10.25 + 200.75 * 15.50) / (100.5 + 200.75) = 13.275
      expect(result).toBeCloseTo(13.275, 3);
    });

    it('should handle UOM conversions with decimal factors', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        alternateUOMs: [
          { name: 'KG', conversionFactor: 2.5 }, // 1 KG = 2.5 PCS
        ],
      };

      const mockGetProductById = vi.mocked(productService.getProductById);
      mockGetProductById.mockResolvedValue(mockProduct as any);

      const result = await inventoryService.convertToBaseUOM(testProductId, 4, 'KG');

      expect(result).toBe(10); // 4 KG * 2.5 PCS/KG = 10 PCS
    });
  });
});
