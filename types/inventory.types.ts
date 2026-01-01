import { Inventory, StockMovement } from '@prisma/client';

export type StockMovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

export type ReferenceType = 'PO' | 'SO' | 'POS' | 'RV';

export type InventoryView = 'list';

export interface AddStockInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  uom: string;
  unitCost: number;
  receivedDate?: Date;
  reason?: string;
  referenceId?: string;
  referenceType?: ReferenceType;
}

export interface DeductStockInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  uom: string;
  referenceId?: string;
  referenceType?: ReferenceType;
  reason?: string;
}

export interface TransferStockInput {
  productId: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: number;
  uom: string;
  reason?: string;
}

export interface TransferStockItemInput {
  productId: string;
  quantity: number;
  uom: string;
}

export interface TransferStockBatchInput {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  items: TransferStockItemInput[];
  reason?: string;
  transferDate?: Date;
  referenceNumber?: string;
}

export interface AdjustStockBatchItem {
  productId: string;
  quantity: number;
  uom: string;
  adjustmentType: 'ABSOLUTE' | 'RELATIVE'; // ABSOLUTE: set to quantity, RELATIVE: add/subtract
}

export interface AdjustStockBatchInput {
  warehouseId: string;
  reason: string;
  adjustmentDate?: Date;
  referenceNumber?: string;
  items: AdjustStockBatchItem[];
}

export interface AdjustmentSlipItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  baseUOM: string;
  warehouseId: string;
  warehouseName: string;
  createdAt: Date;
}

export interface AdjustmentSlip {
  referenceId: string;
  referenceNumber?: string;
  warehouseId: string;
  warehouseName: string;
  reason: string;
  adjustmentDate: Date;
  items: AdjustmentSlipItem[];
  totalItems: number;
  createdAt: Date;
}

export interface AdjustmentFilters {
  warehouseId?: string;
  productId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

export interface CreateStockMovementInput {
  productId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  referenceId?: string;
  referenceType?: ReferenceType;
}

export interface InventoryFilters {
  productId?: string;
  warehouseId?: string;
}

export interface StockMovementFilters {
  productId?: string;
  warehouseId?: string;
  type?: StockMovementType;
  referenceId?: string;
  referenceType?: ReferenceType;
  dateFrom?: Date;
  dateTo?: Date;
}

export type InventoryWithRelations = Inventory & {
  Product: {
    id: string;
    name: string;
    baseUOM: string;
    category: string;
    averageCostPrice: number;
  };
  Warehouse: {
    id: string;
    name: string;
    location: string;
  };
};

export type StockMovementWithRelations = StockMovement & {
  Product: {
    id: string;
    name: string;
    baseUOM: string;
  };
  Warehouse: {
    id: string;
    name: string;
  };
};

export interface StockLevel {
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  totalQuantity: number;
  baseUOM: string;
  weightedAverageCost: number;
}

export interface ProductInventorySummary {
  productId: string;
  productName: string;
  category: string;
  baseUOM: string;
  totalQuantity: number;
  weightedAverageCost: number;
  totalValue: number;
  batchCount: number;
  warehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    quantity: number;
  }>;
}

// Type aliases for backwards compatibility
export type MovementWithRelations = StockMovementWithRelations;
export type MovementType = StockMovementType;
export type MovementFilters = StockMovementFilters;
