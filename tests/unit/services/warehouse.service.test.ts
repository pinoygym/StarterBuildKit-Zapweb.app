import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WarehouseService } from '@/services/warehouse.service';
import { warehouseRepository } from '@/repositories/warehouse.repository';

// Mock dependencies
vi.mock('@/repositories/warehouse.repository', () => ({
  warehouseRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByBranchId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getCurrentStock: vi.fn(),
    getProductDistribution: vi.fn(),
  },
}));

describe('WarehouseService', () => {
  let service: WarehouseService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WarehouseService();
  });

  describe('createWarehouse', () => {
    it('should create a warehouse successfully', async () => {
      const input = {
        name: 'Test Warehouse',
        location: 'Test Location',
        manager: 'Test Manager',
        branchId: 'clp1234567890123456789012', // Valid CUID-like string
        maxCapacity: 1000,
      };

      vi.mocked(warehouseRepository.create).mockResolvedValue({ id: 'wh-1', ...input } as any);

      const result = await service.createWarehouse(input as any);

      expect(warehouseRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if capacity is invalid', async () => {
      const input = {
        name: 'Test Warehouse',
        location: 'Test Location',
        manager: 'Test Manager',
        branchId: 'clp1234567890123456789012',
        maxCapacity: 0,
      };

      await expect(service.createWarehouse(input as any)).rejects.toThrow();
    });
  });

  describe('validateCapacity', () => {
    it('should validate capacity successfully', async () => {
      const warehouseId = 'wh-1';
      const additionalQty = 100;

      vi.mocked(warehouseRepository.findById).mockResolvedValue({ id: warehouseId, maxCapacity: 1000 } as any);
      vi.mocked(warehouseRepository.getCurrentStock).mockResolvedValue(500);

      const result = await service.validateCapacity(warehouseId, additionalQty);

      expect(result).toBe(true);
    });

    it('should throw error if capacity exceeded', async () => {
      const warehouseId = 'wh-1';
      const additionalQty = 600;

      vi.mocked(warehouseRepository.findById).mockResolvedValue({ id: warehouseId, maxCapacity: 1000 } as any);
      vi.mocked(warehouseRepository.getCurrentStock).mockResolvedValue(500);

      await expect(service.validateCapacity(warehouseId, additionalQty)).rejects.toThrow('Warehouse capacity exceeded');
    });
  });
});