import { Warehouse } from '@prisma/client';
import { warehouseRepository } from '@/repositories/warehouse.repository';
import {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  WarehouseWithUtilization,
  WarehouseAlert,
  WarehouseWithDetails,
} from '@/types/warehouse.types';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { warehouseSchema, updateWarehouseSchema } from '@/lib/validations/warehouse.validation';

export class WarehouseService {
  /**
   * Calculate warehouse utilization percentage
   * @param currentStock - Current stock in base UOM
   * @param maxCapacity - Maximum capacity in base UOM
   * @returns Utilization percentage (0-100)
   */
  calculateUtilization(currentStock: number, maxCapacity: number): number {
    if (maxCapacity <= 0) return 0;
    return Math.round((currentStock / maxCapacity) * 100);
  }

  /**
   * Determine alert level based on utilization
   * @param utilization - Utilization percentage
   * @returns Alert level: 'normal', 'warning' (60%+), or 'critical' (80%+)
   */
  getAlertLevel(utilization: number): 'normal' | 'warning' | 'critical' {
    if (utilization >= 80) return 'critical';
    if (utilization >= 60) return 'warning';
    return 'normal';
  }

  /**
   * Get all warehouses with utilization data
   */
  async getAllWarehouses(): Promise<WarehouseWithUtilization[]> {
    const warehouses = await warehouseRepository.findAll();

    const warehousesWithUtilization = await Promise.all(
      warehouses.map(async (warehouse) => {
        const currentStock = await warehouseRepository.getCurrentStock(warehouse.id);
        const utilization = this.calculateUtilization(currentStock, warehouse.maxCapacity);
        const alertLevel = this.getAlertLevel(utilization);

        return {
          ...warehouse,
          currentStock,
          utilization,
          alertLevel,
        };
      })
    );

    return warehousesWithUtilization;
  }

  /**
   * Get warehouse by ID with utilization data
   */
  async getWarehouseById(id: string): Promise<WarehouseWithDetails> {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundError('Warehouse');
    }

    const currentStock = await warehouseRepository.getCurrentStock(id);
    const utilization = this.calculateUtilization(currentStock, warehouse.maxCapacity);
    const alertLevel = this.getAlertLevel(utilization);
    const productDistribution = await warehouseRepository.getProductDistribution(id);

    return {
      ...warehouse,
      currentStock,
      utilization,
      alertLevel,
      productDistribution,
    };
  }

  /**
   * Get warehouses by branch ID with utilization data
   */
  async getWarehousesByBranch(branchId: string): Promise<WarehouseWithUtilization[]> {
    const warehouses = await warehouseRepository.findByBranchId(branchId);

    const warehousesWithUtilization = await Promise.all(
      warehouses.map(async (warehouse) => {
        const currentStock = await warehouseRepository.getCurrentStock(warehouse.id);
        const utilization = this.calculateUtilization(currentStock, warehouse.maxCapacity);
        const alertLevel = this.getAlertLevel(utilization);

        return {
          ...warehouse,
          currentStock,
          utilization,
          alertLevel,
        };
      })
    );

    return warehousesWithUtilization;
  }

  /**
   * Create a new warehouse
   */
  async createWarehouse(data: CreateWarehouseInput): Promise<Warehouse> {
    // Validate input
    const validationResult = warehouseSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid warehouse data', errors as Record<string, string>);
    }

    // Validate capacity is positive
    if (data.maxCapacity <= 0) {
      throw new ValidationError('Maximum capacity must be greater than 0', {
        maxCapacity: 'Maximum capacity must be greater than 0',
      });
    }

    return await warehouseRepository.create(validationResult.data);
  }

  /**
   * Update an existing warehouse
   */
  async updateWarehouse(id: string, data: UpdateWarehouseInput): Promise<Warehouse> {
    // Check if warehouse exists
    const existingWarehouse = await warehouseRepository.findById(id);
    if (!existingWarehouse) {
      throw new NotFoundError('Warehouse');
    }

    // Validate input
    const validationResult = updateWarehouseSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid warehouse data', errors as Record<string, string>);
    }

    // Validate capacity if being updated
    if (data.maxCapacity !== undefined && data.maxCapacity <= 0) {
      throw new ValidationError('Maximum capacity must be greater than 0', {
        maxCapacity: 'Maximum capacity must be greater than 0',
      });
    }

    // Check if new capacity would be exceeded by current stock
    if (data.maxCapacity !== undefined) {
      const currentStock = await warehouseRepository.getCurrentStock(id);
      if (currentStock > data.maxCapacity) {
        throw new ValidationError(
          `Cannot reduce capacity below current stock level (${currentStock} units)`,
          {
            maxCapacity: `Current stock is ${currentStock} units. Capacity must be at least this amount.`,
          }
        );
      }
    }

    return await warehouseRepository.update(id, validationResult.data);
  }

  /**
   * Delete a warehouse
   */
  async deleteWarehouse(id: string): Promise<void> {
    // Check if warehouse exists
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundError('Warehouse');
    }

    // Check if warehouse has inventory
    const currentStock = await warehouseRepository.getCurrentStock(id);
    if (currentStock > 0) {
      throw new ValidationError('Cannot delete warehouse with existing inventory', {
        warehouse: `This warehouse has ${currentStock} units of inventory. Please transfer or remove inventory first.`,
      });
    }

    // Note: In production, you might also want to check for related records
    // like purchase orders, sales orders, etc.

    await warehouseRepository.delete(id);
  }

  /**
   * Get warehouse capacity alerts
   * Returns warehouses with utilization >= 60%
   */
  async getWarehouseAlerts(branchId?: string): Promise<WarehouseAlert[]> {
    const warehouses = branchId
      ? await this.getWarehousesByBranch(branchId)
      : await this.getAllWarehouses();

    const alerts: WarehouseAlert[] = [];

    for (const warehouse of warehouses) {
      if (warehouse.utilization >= 60) {
        const level = warehouse.utilization >= 80 ? 'critical' : 'warning';
        const message =
          level === 'critical'
            ? `Critical: Warehouse is at ${warehouse.utilization}% capacity`
            : `Warning: Warehouse is at ${warehouse.utilization}% capacity`;

        alerts.push({
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          utilization: warehouse.utilization,
          level,
          message,
        });
      }
    }

    return alerts;
  }

  /**
   * Validate if warehouse can accept additional stock
   * @param warehouseId - Warehouse ID
   * @param additionalQuantity - Quantity to add in base UOM
   * @returns true if capacity allows, throws error otherwise
   */
  async validateCapacity(warehouseId: string, additionalQuantity: number): Promise<boolean> {
    const warehouse = await warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundError('Warehouse');
    }

    const currentStock = await warehouseRepository.getCurrentStock(warehouseId);
    const newTotal = currentStock + additionalQuantity;

    if (newTotal > warehouse.maxCapacity) {
      throw new ValidationError(
        `Warehouse capacity exceeded. Current: ${currentStock}, Adding: ${additionalQuantity}, Max: ${warehouse.maxCapacity}`,
        {
          capacity: `This operation would exceed warehouse capacity by ${newTotal - warehouse.maxCapacity} units`,
        }
      );
    }

    return true;
  }
}

export const warehouseService = new WarehouseService();
