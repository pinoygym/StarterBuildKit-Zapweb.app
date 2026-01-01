import { InventoryAdjustment, InventoryAdjustmentItem, StockMovement } from '@prisma/client';

export type AdjustmentStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';
export type AdjustmentType = 'RELATIVE' | 'ABSOLUTE';

export interface CreateAdjustmentItemInput {
    productId: string;
    quantity: number; // For RELATIVE: +/- value. For ABSOLUTE: Target value.
    uom: string;
    type?: AdjustmentType; // Default RELATIVE
    systemQuantity?: number; // Snapshot
    actualQuantity?: number; // Snapshot
    notes?: string;
}

export interface CreateAdjustmentInput {
    warehouseId: string;
    branchId: string;
    reason: string;
    referenceNumber?: string;
    adjustmentDate?: Date;
    items: CreateAdjustmentItemInput[];
}

export interface UpdateAdjustmentInput {
    reason?: string;
    referenceNumber?: string;
    adjustmentDate?: Date;
    status?: AdjustmentStatus; // Usually only to CANCEL
    items?: CreateAdjustmentItemInput[]; // if provided, replaces all items or merges? Replaces is safer for drafts.
}

export interface InventoryAdjustmentWithRelations extends InventoryAdjustment {
    items: (InventoryAdjustmentItem & {
        Product: {
            id: string;
            name: string;
            baseUOM: string;
        }
    })[];
    Warehouse: {
        id: string;
        name: string;
    };
    Branch: {
        id: string;
        name: string;
    };
    CreatedBy: {
        id: string;
        firstName: string;
        lastName: string;
    };
    PostedBy?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface AdjustmentFilters {
    warehouseId?: string;
    branchId?: string;
    status?: AdjustmentStatus;
    dateFrom?: Date;
    dateTo?: Date;
    searchQuery?: string;
}
