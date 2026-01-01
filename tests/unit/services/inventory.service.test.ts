import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryService } from '@/services/inventory.service';
import { inventoryRepository } from '@/repositories/inventory.repository';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';

// Mock repositories and services
vi.mock('@/repositories/inventory.repository');
vi.mock('@/services/product.service');

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    inventoryBatch: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    warehouse: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InventoryService();
  });

  describe('calculateWeightedAverageCost', () => {
    it('should calculate weighted average cost correctly', async () => {
      const mockBatches = [
        { quantity: new Decimal(100), unitCost: new Decimal(10) },
        { quantity: new Decimal(50), unitCost: new Decimal(12) },
      ];

      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(mockBatches as any);

      const result = await service.calculateWeightedAverageCost('product-1', 'warehouse-1');

      // (100*10 + 50*12) / (100+50) = 1600 / 150 = 10.67
      expect(result).toBeCloseTo(10.67, 2);
    });

    it('should return 0 when no batches exist', async () => {
      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue([]);

      const result = await service.calculateWeightedAverageCost('product-1', 'warehouse-1');

      expect(result).toBe(0);
    });
  });

  describe('getCurrentStockLevel', () => {
    it('should return total quantity from all batches', async () => {
      const mockBatches = [
        { quantity: new Decimal(100) },
        { quantity: new Decimal(50) },
        { quantity: new Decimal(25) },
      ];

      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(mockBatches as any);

      const result = await service.getCurrentStockLevel('product-1', 'warehouse-1');

      expect(result).toBe(175);
    });

    it('should return 0 when no batches exist', async () => {
      vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue([]);

      const result = await service.getCurrentStockLevel('product-1', 'warehouse-1');

      expect(result).toBe(0);
    });
  });

  describe('getBatchById', () => {
    it('should return batch when found', async () => {
      const mockBatch = {
        id: 'batch-1',
        batchNumber: 'BATCH-20241114-0001',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: new Decimal(100),
      };

      vi.mocked(inventoryRepository.findBatchById).mockResolvedValue(mockBatch as any);

      const result = await service.getBatchById('batch-1');

      expect(result).toEqual(mockBatch);
    });

    it('should throw NotFoundError when batch not found', async () => {
      vi.mocked(inventoryRepository.findBatchById).mockResolvedValue(null);

      await expect(service.getBatchById('invalid-id'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllBatches', () => {
    it('should return all batches with filters', async () => {
      const mockBatches = [
        { id: 'batch-1', batchNumber: 'BATCH-001' },
        { id: 'batch-2', batchNumber: 'BATCH-002' },
      ];

      vi.mocked(inventoryRepository.findAllBatches).mockResolvedValue(mockBatches as any);

      const result = await service.getAllBatches({ status: 'active' });

      expect(result).toEqual(mockBatches);
      expect(result).toHaveLength(2);
    });
  });

  describe('getTotalStock', () => {
    it('should return total stock for a product', async () => {
      vi.mocked(inventoryRepository.getTotalStockByProduct).mockResolvedValue(500);

      const result = await service.getTotalStock('product-1');

      expect(result).toBe(500);
    });

    it('should return total stock for a product in specific warehouse', async () => {
      vi.mocked(inventoryRepository.getTotalStockByProduct).mockResolvedValue(250);

      const result = await service.getTotalStock('product-1', 'warehouse-1');

      expect(result).toBe(250);
    });
  });

  describe('getExpiringBatches', () => {
    it('should return batches expiring within 30 days', async () => {
      const mockBatches = [
        { id: 'batch-1', expiryDate: new Date('2024-12-15') },
        { id: 'batch-2', expiryDate: new Date('2024-12-20') },
      ];

      vi.mocked(inventoryRepository.getExpiringBatches).mockResolvedValue(mockBatches as any);

      const result = await service.getExpiringBatches(30);

      expect(result).toEqual(mockBatches);
      expect(result).toHaveLength(2);
    });
  });

  describe('getExpiredBatches', () => {
    it('should return expired batches', async () => {
      const mockBatches = [
        { id: 'batch-1', status: 'expired', expiryDate: new Date('2024-01-01') },
      ];

      vi.mocked(inventoryRepository.getExpiredBatches).mockResolvedValue(mockBatches as any);

      const result = await service.getExpiredBatches();

      expect(result).toEqual(mockBatches);
      expect(result).toHaveLength(1);
    });
  });
});
