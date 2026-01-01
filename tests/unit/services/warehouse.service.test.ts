import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WarehouseService } from '@/services/warehouse.service';
import { warehouseRepository } from '@/repositories/warehouse.repository';
import { DatabaseTestBase, TestUtils } from '@/tests/helpers/test-base';
import { ValidationError, NotFoundError } from '@/lib/errors';

// Mock repository
vi.mock('@/repositories/warehouse.repository');

describe('WarehouseService', () => {
  let warehouseService: WarehouseService;
  let dbTestBase: DatabaseTestBase;
  let testWarehouseId: string;
  let testBranchId: string;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Initialize database test base
    dbTestBase = new DatabaseTestBase();
    await dbTestBase.setup();

    // Create test IDs
    testWarehouseId = TestUtils.generate.id();
    testBranchId = TestUtils.generate.id();

    // Initialize service
    warehouseService = new WarehouseService();
  });

  afterEach(async () => {
    await dbTestBase.teardown();
  });

  describe('calculateUtilization', () => {
    it('should calculate utilization percentage correctly', () => {
      expect(warehouseService.calculateUtilization(500, 1000)).toBe(50);
      expect(warehouseService.calculateUtilization(750, 1000)).toBe(75);
      expect(warehouseService.calculateUtilization(1000, 1000)).toBe(100);
      expect(warehouseService.calculateUtilization(0, 1000)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(warehouseService.calculateUtilization(100, 0)).toBe(0);
      expect(warehouseService.calculateUtilization(100, -100)).toBe(0);
      expect(warehouseService.calculateUtilization(0, 0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(warehouseService.calculateUtilization(333, 1000)).toBe(33); // 33.3 -> 33
      expect(warehouseService.calculateUtilization(667, 1000)).toBe(67); // 66.7 -> 67
    });
  });

  describe('getAlertLevel', () => {
    it('should return normal for utilization below 60%', () => {
      expect(warehouseService.getAlertLevel(0)).toBe('normal');
      expect(warehouseService.getAlertLevel(30)).toBe('normal');
      expect(warehouseService.getAlertLevel(59)).toBe('normal');
    });

    it('should return warning for utilization 60-79%', () => {
      expect(warehouseService.getAlertLevel(60)).toBe('warning');
      expect(warehouseService.getAlertLevel(70)).toBe('warning');
      expect(warehouseService.getAlertLevel(79)).toBe('warning');
    });

    it('should return critical for utilization 80% and above', () => {
      expect(warehouseService.getAlertLevel(80)).toBe('critical');
      expect(warehouseService.getAlertLevel(90)).toBe('critical');
      expect(warehouseService.getAlertLevel(100)).toBe('critical');
      expect(warehouseService.getAlertLevel(150)).toBe('critical');
    });
  });

  describe('getAllWarehouses', () => {
    it('should return all warehouses with utilization data', async () => {
      const mockWarehouses = [
        {
          id: 'wh1',
          name: 'Main Warehouse',
          branchId: testBranchId,
          maxCapacity: 1000,
          address: '123 Main St',
          status: 'active',
        },
        {
          id: 'wh2',
          name: 'Secondary Warehouse',
          branchId: testBranchId,
          maxCapacity: 500,
          address: '456 Side St',
          status: 'active',
        },
      ];

      const mockFindAll = vi.mocked(warehouseRepository.findAll);
      mockFindAll.mockResolvedValue(mockWarehouses as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockImplementation((id: string) => {
        if (id === 'wh1') return Promise.resolve(600); // 60% utilization
        if (id === 'wh2') return Promise.resolve(300); // 60% utilization
        return Promise.resolve(0);
      });

      const result = await warehouseService.getAllWarehouses();

      expect(mockFindAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...mockWarehouses[0],
        currentStock: 600,
        utilization: 60,
        alertLevel: 'warning',
      });
      expect(result[1]).toEqual({
        ...mockWarehouses[1],
        currentStock: 300,
        utilization: 60,
        alertLevel: 'warning',
      });
    });

    it('should handle empty warehouse list', async () => {
      const mockFindAll = vi.mocked(warehouseRepository.findAll);
      mockFindAll.mockResolvedValue([]);

      const result = await warehouseService.getAllWarehouses();

      expect(result).toEqual([]);
    });
  });

  describe('getWarehouseById', () => {
    it('should return warehouse with detailed utilization data', async () => {
      const mockWarehouse = {
        id: testWarehouseId,
        name: 'Main Warehouse',
        branchId: testBranchId,
        maxCapacity: 1000,
        address: '123 Main St',
        status: 'active',
      };

      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(mockWarehouse as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(800); // 80% utilization

      const mockGetProductDistribution = vi.mocked(warehouseRepository.getProductDistribution);
      mockGetProductDistribution.mockResolvedValue([
        { productId: 'prod1', productName: 'Product 1', quantity: 500 },
        { productId: 'prod2', productName: 'Product 2', quantity: 300 },
      ]);

      const result = await warehouseService.getWarehouseById(testWarehouseId);

      expect(mockFindById).toHaveBeenCalledWith(testWarehouseId);
      expect(result).toEqual({
        ...mockWarehouse,
        currentStock: 800,
        utilization: 80,
        alertLevel: 'critical',
        productDistribution: [
          { productId: 'prod1', productName: 'Product 1', quantity: 500 },
          { productId: 'prod2', productName: 'Product 2', quantity: 300 },
        ],
      });
    });

    it('should throw error for non-existent warehouse', async () => {
      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        warehouseService.getWarehouseById(testWarehouseId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getWarehousesByBranch', () => {
    it('should return warehouses for specific branch with utilization', async () => {
      const mockWarehouses = [
        {
          id: 'wh1',
          name: 'Branch Warehouse 1',
          branchId: testBranchId,
          maxCapacity: 800,
          address: 'Branch Address 1',
          status: 'active',
        },
      ];

      const mockFindByBranchId = vi.mocked(warehouseRepository.findByBranchId);
      mockFindByBranchId.mockResolvedValue(mockWarehouses as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(400); // 50% utilization

      const result = await warehouseService.getWarehousesByBranch(testBranchId);

      expect(mockFindByBranchId).toHaveBeenCalledWith(testBranchId);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockWarehouses[0],
        currentStock: 400,
        utilization: 50,
        alertLevel: 'normal',
      });
    });
  });

  describe('createWarehouse', () => {
    const createData = {
      name: 'New Warehouse',
      branchId: testBranchId,
      maxCapacity: 1000,
      address: '123 New St',
      contactPerson: 'John Manager',
      contactPhone: '+1234567890',
      notes: 'New warehouse for expansion',
    };

    it('should create warehouse successfully', async () => {
      const mockCreate = vi.mocked(warehouseRepository.create);
      mockCreate.mockResolvedValue({
        id: testWarehouseId,
        ...createData,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await warehouseService.createWarehouse(createData);

      expect(mockCreate).toHaveBeenCalledWith(createData);
      expect(result.id).toBe(testWarehouseId);
      expect(result.name).toBe('New Warehouse');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '',
        branchId: testBranchId,
        maxCapacity: 1000,
        address: '123 New St',
      };

      await expect(
        warehouseService.createWarehouse(invalidData as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate positive capacity', async () => {
      const invalidData = {
        ...createData,
        maxCapacity: 0,
      };

      await expect(
        warehouseService.createWarehouse(invalidData)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate negative capacity', async () => {
      const invalidData = {
        ...createData,
        maxCapacity: -100,
      };

      await expect(
        warehouseService.createWarehouse(invalidData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateWarehouse', () => {
    const updateData = {
      name: 'Updated Warehouse',
      maxCapacity: 1200,
      address: '456 Updated St',
      contactPerson: 'Jane Manager',
    };

    it('should update warehouse successfully', async () => {
      const mockExistingWarehouse = {
        id: testWarehouseId,
        name: 'Old Warehouse',
        branchId: testBranchId,
        maxCapacity: 1000,
        address: '123 Old St',
        status: 'active',
      };

      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(mockExistingWarehouse as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(800); // Below new capacity

      const mockUpdate = vi.mocked(warehouseRepository.update);
      mockUpdate.mockResolvedValue({
        ...mockExistingWarehouse,
        ...updateData,
        updatedAt: new Date(),
      } as any);

      const result = await warehouseService.updateWarehouse(testWarehouseId, updateData);

      expect(mockUpdate).toHaveBeenCalledWith(testWarehouseId, updateData);
      expect(result.name).toBe('Updated Warehouse');
      expect(result.maxCapacity).toBe(1200);
    });

    it('should throw error for non-existent warehouse', async () => {
      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        warehouseService.updateWarehouse(testWarehouseId, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should validate capacity reduction below current stock', async () => {
      const mockExistingWarehouse = {
        id: testWarehouseId,
        name: 'Warehouse',
        branchId: testBranchId,
        maxCapacity: 1000,
        status: 'active',
      };

      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(mockExistingWarehouse as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(800); // Current stock

      const invalidUpdate = {
        maxCapacity: 700, // Below current stock
      };

      await expect(
        warehouseService.updateWarehouse(testWarehouseId, invalidUpdate)
      ).rejects.toThrow(ValidationError);
    });

    it('should allow capacity reduction when stock is below new capacity', async () => {
      const mockExistingWarehouse = {
        id: testWarehouseId,
        name: 'Warehouse',
        branchId: testBranchId,
        maxCapacity: 1000,
        status: 'active',
      };

      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(mockExistingWarehouse as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(600); // Below new capacity

      const mockUpdate = vi.mocked(warehouseRepository.update);
      mockUpdate.mockResolvedValue({
        ...mockExistingWarehouse,
        maxCapacity: 700,
        updatedAt: new Date(),
      } as any);

      const result = await warehouseService.updateWarehouse(testWarehouseId, {
        maxCapacity: 700,
      });

      expect(result.maxCapacity).toBe(700);
    });
  });

  describe('deleteWarehouse', () => {
    it('should delete warehouse successfully when empty', async () => {
      const mockWarehouse = {
        id: testWarehouseId,
        name: 'Empty Warehouse',
        branchId: testBranchId,
        maxCapacity: 1000,
        status: 'active',
      };

      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(mockWarehouse as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(0); // Empty warehouse

      const mockDelete = vi.mocked(warehouseRepository.delete);
      mockDelete.mockResolvedValue(undefined);

      await expect(
        warehouseService.deleteWarehouse(testWarehouseId)
      ).resolves.not.toThrow();

      expect(mockDelete).toHaveBeenCalledWith(testWarehouseId);
    });

    it('should throw error for non-existent warehouse', async () => {
      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        warehouseService.deleteWarehouse(testWarehouseId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error when warehouse has inventory', async () => {
      const mockWarehouse = {
        id: testWarehouseId,
        name: 'Stocked Warehouse',
        branchId: testBranchId,
        maxCapacity: 1000,
        status: 'active',
      };

      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(mockWarehouse as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(500); // Has inventory

      await expect(
        warehouseService.deleteWarehouse(testWarehouseId)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getWarehouseAlerts', () => {
    it('should return alerts for warehouses above 60% utilization', async () => {
      const mockWarehouses = [
        {
          id: 'wh1',
          name: 'Normal Warehouse',
          branchId: testBranchId,
          maxCapacity: 1000,
          currentStock: 400, // 40% - normal
          utilization: 40,
          alertLevel: 'normal',
        },
        {
          id: 'wh2',
          name: 'Warning Warehouse',
          branchId: testBranchId,
          maxCapacity: 1000,
          currentStock: 700, // 70% - warning
          utilization: 70,
          alertLevel: 'warning',
        },
        {
          id: 'wh3',
          name: 'Critical Warehouse',
          branchId: testBranchId,
          maxCapacity: 1000,
          currentStock: 900, // 90% - critical
          utilization: 90,
          alertLevel: 'critical',
        },
      ];

      const mockGetAllWarehouses = vi.mocked(warehouseService.getAllWarehouses);
      mockGetAllWarehouses.mockResolvedValue(mockWarehouses as any);

      const result = await warehouseService.getWarehouseAlerts();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        warehouseId: 'wh2',
        warehouseName: 'Warning Warehouse',
        utilization: 70,
        level: 'warning',
        message: 'Warning: Warehouse is at 70% capacity',
      });
      expect(result[1]).toEqual({
        warehouseId: 'wh3',
        warehouseName: 'Critical Warehouse',
        utilization: 90,
        level: 'critical',
        message: 'Critical: Warehouse is at 90% capacity',
      });
    });

    it('should filter alerts by branch', async () => {
      const mockWarehouses = [
        {
          id: 'wh1',
          name: 'Branch Warehouse',
          branchId: testBranchId,
          maxCapacity: 1000,
          currentStock: 800,
          utilization: 80,
          alertLevel: 'critical',
        },
      ];

      const mockGetWarehousesByBranch = vi.mocked(warehouseService.getWarehousesByBranch);
      mockGetWarehousesByBranch.mockResolvedValue(mockWarehouses as any);

      const result = await warehouseService.getWarehouseAlerts(testBranchId);

      expect(mockGetWarehousesByBranch).toHaveBeenCalledWith(testBranchId);
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('critical');
    });

    it('should return empty array when no alerts', async () => {
      const mockWarehouses = [
        {
          id: 'wh1',
          name: 'Normal Warehouse',
          branchId: testBranchId,
          maxCapacity: 1000,
          currentStock: 300, // 30% - normal
          utilization: 30,
          alertLevel: 'normal',
        },
      ];

      const mockGetAllWarehouses = vi.mocked(warehouseService.getAllWarehouses);
      mockGetAllWarehouses.mockResolvedValue(mockWarehouses as any);

      const result = await warehouseService.getWarehouseAlerts();

      expect(result).toEqual([]);
    });
  });

  describe('validateCapacity', () => {
    it('should validate capacity successfully when within limits', async () => {
      const mockWarehouse = {
        id: testWarehouseId,
        name: 'Test Warehouse',
        maxCapacity: 1000,
      };

      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(mockWarehouse as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(600); // Current stock

      const result = await warehouseService.validateCapacity(testWarehouseId, 300); // Adding 300

      expect(result).toBe(true);
      // 600 + 300 = 900, which is below 1000 capacity
    });

    it('should throw error when capacity would be exceeded', async () => {
      const mockWarehouse = {
        id: testWarehouseId,
        name: 'Test Warehouse',
        maxCapacity: 1000,
      };

      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(mockWarehouse as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(800); // Current stock

      await expect(
        warehouseService.validateCapacity(testWarehouseId, 300) // Adding 300, total 1100 > 1000
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for non-existent warehouse', async () => {
      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        warehouseService.validateCapacity(testWarehouseId, 100)
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle zero additional quantity', async () => {
      const mockWarehouse = {
        id: testWarehouseId,
        name: 'Test Warehouse',
        maxCapacity: 1000,
      };

      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(mockWarehouse as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(500);

      const result = await warehouseService.validateCapacity(testWarehouseId, 0);

      expect(result).toBe(true);
    });
  });

  describe('Business Logic Integration', () => {
    it('should handle complete warehouse capacity management workflow', async () => {
      // 1. Create warehouse
      const createData = {
        name: 'Distribution Center',
        branchId: testBranchId,
        maxCapacity: 5000,
        address: '789 Distribution Ave',
        contactPerson: 'Mike Logistics',
        contactPhone: '+1987654321',
      };

      const mockCreate = vi.mocked(warehouseRepository.create);
      mockCreate.mockResolvedValue({
        id: testWarehouseId,
        ...createData,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const createdWarehouse = await warehouseService.createWarehouse(createData);
      expect(createdWarehouse.maxCapacity).toBe(5000);

      // 2. Check initial utilization (empty warehouse)
      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(createdWarehouse as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(0);

      const mockGetProductDistribution = vi.mocked(warehouseRepository.getProductDistribution);
      mockGetProductDistribution.mockResolvedValue([]);

      const warehouseDetails = await warehouseService.getWarehouseById(testWarehouseId);
      expect(warehouseDetails.utilization).toBe(0);
      expect(warehouseDetails.alertLevel).toBe('normal');

      // 3. Simulate stock addition and check capacity validation
      mockGetCurrentStock.mockResolvedValue(3000); // 60% utilization

      const capacityCheck = await warehouseService.validateCapacity(testWarehouseId, 1000); // Adding 1000
      expect(capacityCheck).toBe(true); // 3000 + 1000 = 4000 < 5000

      // 4. Check alerts when utilization increases
      const mockGetAllWarehouses = vi.mocked(warehouseService.getAllWarehouses);
      mockGetAllWarehouses.mockResolvedValue([
        {
          ...createdWarehouse,
          currentStock: 3500, // 70% utilization
          utilization: 70,
          alertLevel: 'warning',
        },
      ] as any);

      const alerts = await warehouseService.getWarehouseAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].level).toBe('warning');
      expect(alerts[0].utilization).toBe(70);

      // 5. Update warehouse capacity
      mockGetCurrentStock.mockResolvedValue(3500);

      const mockUpdate = vi.mocked(warehouseRepository.update);
      mockUpdate.mockResolvedValue({
        ...createdWarehouse,
        maxCapacity: 6000,
        updatedAt: new Date(),
      } as any);

      const updatedWarehouse = await warehouseService.updateWarehouse(testWarehouseId, {
        maxCapacity: 6000,
      });

      expect(updatedWarehouse.maxCapacity).toBe(6000);

      // 6. Verify updated utilization calculation
      const updatedDetails = await warehouseService.getWarehouseById(testWarehouseId);
      expect(updatedDetails.utilization).toBe(58); // 3500 / 6000 * 100 ≈ 58%
      expect(updatedDetails.alertLevel).toBe('normal');
    });

    it('should handle multi-warehouse capacity planning', async () => {
      const warehouses = [
        {
          id: 'wh1',
          name: 'North Warehouse',
          branchId: testBranchId,
          maxCapacity: 2000,
          currentStock: 1800, // 90% - critical
          utilization: 90,
          alertLevel: 'critical',
        },
        {
          id: 'wh2',
          name: 'South Warehouse',
          branchId: testBranchId,
          maxCapacity: 3000,
          currentStock: 1200, // 40% - normal
          utilization: 40,
          alertLevel: 'normal',
        },
        {
          id: 'wh3',
          name: 'East Warehouse',
          branchId: testBranchId,
          maxCapacity: 2500,
          currentStock: 1600, // 64% - warning
          utilization: 64,
          alertLevel: 'warning',
        },
      ];

      // Test capacity validation across warehouses
      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockImplementation((id: string) => {
        const warehouse = warehouses.find(w => w.id === id);
        return Promise.resolve(warehouse as any);
      });

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockImplementation((id: string) => {
        const warehouse = warehouses.find(w => w.id === id);
        return Promise.resolve(warehouse?.currentStock || 0);
      });

      // Validate capacity for each warehouse
      await expect(
        warehouseService.validateCapacity('wh1', 300) // 1800 + 300 = 2100 > 2000
      ).rejects.toThrow(ValidationError);

      const result2 = await warehouseService.validateCapacity('wh2', 800); // 1200 + 800 = 2000 <= 3000
      expect(result2).toBe(true);

      const result3 = await warehouseService.validateCapacity('wh3', 400); // 1600 + 400 = 2000 <= 2500
      expect(result3).toBe(true);

      // Test alerts across all warehouses
      const mockGetAllWarehouses = vi.mocked(warehouseService.getAllWarehouses);
      mockGetAllWarehouses.mockResolvedValue(warehouses as any);

      const alerts = await warehouseService.getWarehouseAlerts();

      expect(alerts).toHaveLength(2);
      expect(alerts.find(a => a.warehouseId === 'wh1')?.level).toBe('critical');
      expect(alerts.find(a => a.warehouseId === 'wh3')?.level).toBe('warning');
      expect(alerts.find(a => a.warehouseId === 'wh2')).toBeUndefined();

      // Test branch-specific alerts
      const mockGetWarehousesByBranch = vi.mocked(warehouseService.getWarehousesByBranch);
      mockGetWarehousesByBranch.mockResolvedValue(warehouses as any);

      const branchAlerts = await warehouseService.getWarehouseAlerts(testBranchId);
      expect(branchAlerts).toHaveLength(2);
    });

    it('should handle warehouse lifecycle management', async () => {
      // 1. Create warehouse
      const createData = {
        name: 'Temporary Warehouse',
        branchId: testBranchId,
        maxCapacity: 1000,
        address: 'Temp Location',
      };

      const mockCreate = vi.mocked(warehouseRepository.create);
      mockCreate.mockResolvedValue({
        id: testWarehouseId,
        ...createData,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await warehouseService.createWarehouse(createData);

      // 2. Update warehouse details
      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue({
        id: testWarehouseId,
        ...createData,
        status: 'active',
      } as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(0);

      const mockUpdate = vi.mocked(warehouseRepository.update);
      mockUpdate.mockResolvedValue({
        id: testWarehouseId,
        name: 'Updated Temporary Warehouse',
        branchId: testBranchId,
        maxCapacity: 1500,
        address: 'Updated Temp Location',
        status: 'active',
        updatedAt: new Date(),
      } as any);

      await warehouseService.updateWarehouse(testWarehouseId, {
        name: 'Updated Temporary Warehouse',
        maxCapacity: 1500,
        address: 'Updated Temp Location',
      });

      // 3. Attempt to delete (should succeed when empty)
      const mockDelete = vi.mocked(warehouseRepository.delete);
      mockDelete.mockResolvedValue(undefined);

      await warehouseService.deleteWarehouse(testWarehouseId);
      expect(mockDelete).toHaveBeenCalledWith(testWarehouseId);

      // 4. Verify warehouse is removed from utilization calculations
      const mockGetAllWarehouses = vi.mocked(warehouseService.getAllWarehouses);
      mockGetAllWarehouses.mockResolvedValue([]); // No warehouses after deletion

      const allWarehouses = await warehouseService.getAllWarehouses();
      expect(allWarehouses).toHaveLength(0);

      const alerts = await warehouseService.getWarehouseAlerts();
      expect(alerts).toHaveLength(0);
    });

    it('should handle product distribution analytics', async () => {
      const mockWarehouse = {
        id: testWarehouseId,
        name: 'Analytics Warehouse',
        branchId: testBranchId,
        maxCapacity: 5000,
        address: 'Analytics St',
        status: 'active',
      };

      const mockFindById = vi.mocked(warehouseRepository.findById);
      mockFindById.mockResolvedValue(mockWarehouse as any);

      const mockGetCurrentStock = vi.mocked(warehouseRepository.getCurrentStock);
      mockGetCurrentStock.mockResolvedValue(2500); // 50% utilization

      const mockGetProductDistribution = vi.mocked(warehouseRepository.getProductDistribution);
      mockGetProductDistribution.mockResolvedValue([
        { productId: 'prod1', productName: 'High-Value Product A', quantity: 800 },
        { productId: 'prod2', productName: 'Medium-Value Product B', quantity: 1200 },
        { productId: 'prod3', productName: 'Low-Value Product C', quantity: 500 },
        { productId: 'prod4', productName: 'Seasonal Product D', quantity: 0 }, // No stock
      ]);

      const warehouseDetails = await warehouseService.getWarehouseById(testWarehouseId);

      expect(warehouseDetails.productDistribution).toHaveLength(4);
      expect(warehouseDetails.productDistribution[0]).toEqual({
        productId: 'prod1',
        productName: 'High-Value Product A',
        quantity: 800,
      });
      expect(warehouseDetails.productDistribution[1]).toEqual({
        productId: 'prod2',
        productName: 'Medium-Value Product B',
        quantity: 1200,
      });

      // Verify total matches current stock
      const totalFromDistribution = warehouseDetails.productDistribution.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      expect(totalFromDistribution).toBe(2500);
    });
  });
});