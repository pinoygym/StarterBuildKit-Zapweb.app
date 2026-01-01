import { PurchaseOrder, PurchaseOrderItem, Supplier, Warehouse, Branch } from '@prisma/client';

export type PurchaseOrderStatus = 'draft' | 'pending' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  warehouseId: string;
  branchId: string;
  expectedDeliveryDate: Date;
  notes?: string;
  items: PurchaseOrderItemInput[];
}

export interface UpdatePurchaseOrderInput {
  supplierId?: string;
  warehouseId?: string;
  branchId?: string;
  expectedDeliveryDate?: Date;
  notes?: string;
  items?: PurchaseOrderItemInput[];
}

export interface CancelPurchaseOrderInput {
  reason: string;
}

export type PurchaseOrderWithDetails = PurchaseOrder & {
  supplier: Supplier;
  warehouse: Warehouse;
  branch: Branch;
  items: (PurchaseOrderItem & {
    product: {
      id: string;
      name: string;
      baseUOM: string;
    };
  })[];
};

export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus;
  branchId?: string;
  supplierId?: string;
  warehouseId?: string;
  startDate?: Date;
  endDate?: Date;
}
