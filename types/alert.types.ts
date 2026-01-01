import { Product, Warehouse, InventoryBatch } from '@prisma/client';

export type AlertType = 'low_stock' | 'expiring_soon' | 'expired';
export type AlertSeverity = 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  branchId: string;
  details: string;
  currentStock?: number;
  minStockLevel?: number;
  shortageAmount?: number;
  expiryDate?: Date;
  daysUntilExpiry?: number;
  batchNumber?: string;
  batchId?: string;
}

export interface AlertCounts {
  lowStock: number;
  expiringSoon: number;
  expired: number;
  total: number;
}

export interface AlertFilters {
  branchId?: string;
  type?: AlertType;
  severity?: AlertSeverity;
  warehouseId?: string;
}

export interface LowStockAlert {
  product: Product;
  warehouse: Warehouse;
  currentStock: number;
  minStockLevel: number;
  shortageAmount: number;
}

export interface ExpiringAlert {
  batch: InventoryBatch;
  product: Product;
  warehouse: Warehouse;
  daysUntilExpiry: number;
}
