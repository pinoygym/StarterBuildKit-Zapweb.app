import { InventoryBatch, StockMovement } from '@prisma/client';

export type InventoryBatchStatus = 'active' | 'expired' | 'depleted';

export type StockMovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

export type ReferenceType = 'PO' | 'SO' | 'POS' | 'RV';

export interface CreateInventoryBatchInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  expiryDate: Date;
  receivedDate: Date;
  status?: InventoryBatchStatus;
}

export interface UpdateInventoryBatchInput {
  quantity?: number;
  unitCost?: number;
  expiryDate?: Date;
  status?: InventoryBatchStatus;
}

export interface AddStockInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  uom: string;
  unitCost: number;
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
  batchId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  referenceId?: string;
  referenceType?: ReferenceType;
}

export interface InventoryBatchFilters {
  productId?: string;
  warehouseId?: string;
  status?: InventoryBatchStatus;
  expiryDateFrom?: Date;
  expiryDateTo?: Date;
}

export interface StockMovementFilters {
  batchId?: string;
  productId?: string;
  warehouseId?: string;
  type?: StockMovementType;
  referenceId?: string;
  referenceType?: ReferenceType;
  dateFrom?: Date;
  dateTo?: Date;
}

export type InventoryBatchWithRelations = InventoryBatch & {
  product: {
    id: string;
    name: string;
    baseUOM: string;
    category: string;
  };
  warehouse: {
    id: string;
    name: string;
    location: string;
  };
};

// Alias for compatibility
export type BatchWithRelations = InventoryBatchWithRelations;

export type StockMovementWithRelations = StockMovement & {
  batch: InventoryBatch & {
    product: {
      id: string;
      name: string;
      baseUOM: string;
    };
    warehouse: {
      id: string;
      name: string;
    };
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
  batches: Array<{
    batchNumber: string;
    quantity: number;
    unitCost: number;
    expiryDate: Date;
    status: string;
  }>;
}
