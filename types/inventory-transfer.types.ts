import { InventoryTransfer, InventoryTransferItem } from '@prisma/client';

export type TransferStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export interface CreateTransferItemInput {
    productId: string;
    quantity: number;
    uom: string;
}

export interface CreateTransferInput {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    branchId: string;
    reason?: string;
    transferDate?: Date;
    items: CreateTransferItemInput[];
}

export interface UpdateTransferInput {
    sourceWarehouseId?: string;
    destinationWarehouseId?: string;
    branchId?: string;
    reason?: string;
    transferDate?: Date;
    status?: TransferStatus;
    items?: CreateTransferItemInput[];
}

export interface InventoryTransferWithRelations extends InventoryTransfer {
    items: (InventoryTransferItem & {
        Product: {
            id: string;
            name: string;
            baseUOM: string;
            productUOMs?: {
                id: string;
                name: string;
                conversionFactor: number;
            }[];
        }
    })[];
    sourceWarehouse: {
        id: string;
        name: string;
    };
    destinationWarehouse: {
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
}

export interface TransferFilters {
    sourceWarehouseId?: string;
    destinationWarehouseId?: string;
    branchId?: string;
    status?: TransferStatus;
    dateFrom?: Date;
    dateTo?: Date;
    searchQuery?: string;
    page?: number;
    limit?: number;
}

export interface InventoryTransfersResponse {
    data: InventoryTransferWithRelations[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
