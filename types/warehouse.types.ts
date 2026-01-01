import { Warehouse } from '@prisma/client';

export interface CreateWarehouseInput {
  name: string;
  location: string;
  manager: string;
  maxCapacity: number;
  branchId: string;
}

export interface UpdateWarehouseInput {
  name?: string;
  location?: string;
  manager?: string;
  maxCapacity?: number;
  branchId?: string;
}

export interface WarehouseWithUtilization extends Warehouse {
  currentStock: number;
  utilization: number;
  alertLevel: 'normal' | 'warning' | 'critical';
}

export interface WarehouseAlert {
  warehouseId: string;
  warehouseName: string;
  utilization: number;
  level: 'warning' | 'critical';
  message: string;
}

export interface ProductDistribution {
  productId: string;
  productName: string;
  quantity: number;
  baseUOM: string;
}

export interface WarehouseWithDetails extends WarehouseWithUtilization {
  productDistribution: ProductDistribution[];
}
