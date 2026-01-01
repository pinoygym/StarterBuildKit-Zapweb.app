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
  describe('calculateUtilization', () => {
    it('should return 0 when maxCapacity is 0 or negative', () => {
      expect(service.calculateUtilization(100, 0)).toBe(0);
      expect(service.calculateUtilization(100, -10)).toBe(0);
    });

    it('should calculate correct percentage', () => {
      expect(service.calculateUtilization(500, 1000)).toBe(50);
      expect(service.calculateUtilization(200, 1000)).toBe(20);
      expect(service.calculateUtilization(0, 1000)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(service.calculateUtilization(333, 1000)).toBe(33);
    });
  });

  describe('getAlertLevel', () => {
    it('should return critical for >= 80%', () => {
      expect(service.getAlertLevel(80)).toBe('critical');
      expect(service.getAlertLevel(90)).toBe('critical');
    });

    it('should return warning for >= 60% and < 80%', () => {
      expect(service.getAlertLevel(60)).toBe('warning');
      expect(service.getAlertLevel(79)).toBe('warning');
    });

    it('should return normal for < 60%', () => {
      expect(service.getAlertLevel(59)).toBe('normal');
      expect(service.getAlertLevel(0)).toBe('normal');
    });
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

  describe('getWarehouseById', () => {
    it('should return warehouse with details', async () => {
      const warehouseId = 'wh-1';
      const mockWarehouse = { id: warehouseId, maxCapacity: 1000 };
      const mockStock = 500;
      const mockDistribution = { 'Category A': 100 };

      vi.mocked(warehouseRepository.findById).mockResolvedValue(mockWarehouse as any);
      vi.mocked(warehouseRepository.getCurrentStock).mockResolvedValue(mockStock);
      vi.mocked(warehouseRepository.getProductDistribution).mockResolvedValue(mockDistribution as any);

      const result = await service.getWarehouseById(warehouseId);

      expect(result).toBeDefined();
      expect(result.id).toBe(warehouseId);
      expect(result.currentStock).toBe(mockStock);
      expect(result.utilization).toBe(50);
      expect(result.alertLevel).toBe('normal');
      expect(result.productDistribution).toEqual(mockDistribution);
    });

    it('should throw NotFoundError if warehouse does not exist', async () => {
      vi.mocked(warehouseRepository.findById).mockResolvedValue(null);
      await expect(service.getWarehouseById('non-existent')).rejects.toThrow('Warehouse');
    });
  });

  describe('getAllWarehouses', () => {
    it('should return all warehouses with utilization', async () => {
      const mockWarehouses = [
        { id: 'wh-1', maxCapacity: 1000 },
        { id: 'wh-2', maxCapacity: 2000 },
      ];

      vi.mocked(warehouseRepository.findAll).mockResolvedValue(mockWarehouses as any);
      vi.mocked(warehouseRepository.getCurrentStock).mockResolvedValue(500);

      const result = await service.getAllWarehouses();

      expect(result).toHaveLength(2);
      expect(result[0].utilization).toBe(50);
      expect(result[1].utilization).toBe(25);
    });
  });

  describe('getWarehousesByBranch', () => {
    it('should return warehouses for branch with utilization', async () => {
      const branchId = 'br-1';
      const mockWarehouses = [{ id: 'wh-1', maxCapacity: 1000, branchId }];

      vi.mocked(warehouseRepository.findByBranchId).mockResolvedValue(mockWarehouses as any);
      vi.mocked(warehouseRepository.getCurrentStock).mockResolvedValue(800);

      const result = await service.getWarehousesByBranch(branchId);

      expect(result).toHaveLength(1);
      expect(result[0].utilization).toBe(80);
      expect(result[0].alertLevel).toBe('critical');
    });
  });

  describe('updateWarehouse', () => {
    it('should update warehouse successfully', async () => {
      const id = 'wh-1';
      const updateData = { name: 'Updated Name', maxCapacity: 2000 };

      vi.mocked(warehouseRepository.findById).mockResolvedValue({ id, maxCapacity: 1000 } as any);
      vi.mocked(warehouseRepository.getCurrentStock).mockResolvedValue(500);
      vi.mocked(warehouseRepository.update).mockResolvedValue({ id, ...updateData } as any);

      const result = await service.updateWarehouse(id, updateData);

      expect(result.name).toBe('Updated Name');
      expect(warehouseRepository.update).toHaveBeenCalledWith(id, updateData);
    });

    it('should throw error if attempting to reduce capacity below current stock', async () => {
      const id = 'wh-1';
      const updateData = { maxCapacity: 400 };

      vi.mocked(warehouseRepository.findById).mockResolvedValue({ id, maxCapacity: 1000 } as any);
      vi.mocked(warehouseRepository.getCurrentStock).mockResolvedValue(500);

      await expect(service.updateWarehouse(id, updateData)).rejects.toThrow('Cannot reduce capacity');
    });

    it('should throw NotFoundError if warehouse not found', async () => {
      vi.mocked(warehouseRepository.findById).mockResolvedValue(null);
      await expect(service.updateWarehouse('wh-1', {})).rejects.toThrow('Warehouse');
    });
  });

  describe('deleteWarehouse', () => {
    it('should delete warehouse successfully if empty', async () => {
      const id = 'wh-1';
      vi.mocked(warehouseRepository.findById).mockResolvedValue({ id } as any);
      vi.mocked(warehouseRepository.getCurrentStock).mockResolvedValue(0);

      await service.deleteWarehouse(id);

      expect(warehouseRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw error if warehouse has inventory', async () => {
      const id = 'wh-1';
      vi.mocked(warehouseRepository.findById).mockResolvedValue({ id } as any);
      vi.mocked(warehouseRepository.getCurrentStock).mockResolvedValue(10);

      await expect(service.deleteWarehouse(id)).rejects.toThrow('Cannot delete warehouse with existing inventory');
    });

    it('should throw NotFoundError if warehouse not found', async () => {
      vi.mocked(warehouseRepository.findById).mockResolvedValue(null);
      await expect(service.deleteWarehouse('wh-1')).rejects.toThrow('Warehouse');
    });
  });

  describe('getWarehouseAlerts', () => {
    it('should return only warehouses with >= 60% utilization', async () => {
      const mockWarehouses = [
        { id: 'wh-1', maxCapacity: 1000, name: 'Normal' },
        { id: 'wh-2', maxCapacity: 1000, name: 'Warning' },
        { id: 'wh-3', maxCapacity: 1000, name: 'Critical' },
      ];

      vi.mocked(warehouseRepository.findAll).mockResolvedValue(mockWarehouses as any);

      // Mock stock: 500 (50%), 700 (70%), 900 (90%)
      vi.mocked(warehouseRepository.getCurrentStock)
        .mockResolvedValueOnce(500)
        .mockResolvedValueOnce(700)
        .mockResolvedValueOnce(900);

      const alerts = await service.getWarehouseAlerts();

      expect(alerts).toHaveLength(2);
      expect(alerts[0].level).toBe('warning');
      expect(alerts[1].level).toBe('critical');
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