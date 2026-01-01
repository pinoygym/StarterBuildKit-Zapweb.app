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
