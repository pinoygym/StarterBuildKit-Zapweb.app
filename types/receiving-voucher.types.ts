import { Prisma } from '@prisma/client';

export type ReceivingVoucher = Prisma.ReceivingVoucherGetPayload<{}>;

export type ReceivingVoucherItem = Prisma.ReceivingVoucherItemGetPayload<{}>;

export type ReceivingVoucherWithDetails = Prisma.ReceivingVoucherGetPayload<{
  include: {
    PurchaseOrder: {
      include: {
        Supplier: true;
      };
    };
    Warehouse: true;
    Branch: true;
    ReceivingVoucherItem: {
      include: {
        Product: true;
      };
    };
  };
}>;

export interface CreateReceivingVoucherInput {
  purchaseOrderId: string;
  receiverName: string;
  deliveryNotes?: string;
  items: CreateReceivingVoucherItemInput[];
}

export interface CreateReceivingVoucherItemInput {
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  varianceReason?: string;
  unitPrice: number;
}

export interface ReceivingVoucherFilters {
  branchId?: string;
  warehouseId?: string;
  supplierId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  rvNumber?: string;
  poNumber?: string;
}

export interface VarianceReport {
  supplierId: string;
  supplierName: string;
  totalPOs: number;
  averageVariancePercentage: number;
  overDeliveryCount: number;
  underDeliveryCount: number;
  exactMatchCount: number;
  products: ProductVariance[];
}

export interface ProductVariance {
  productId: string;
  productName: string;
  totalOrdered: number;
  totalReceived: number;
  totalVariance: number;
  varianceFrequency: number;
}

export interface BulkProcessResult {
  success: boolean;
  rvNumber?: string;
  error?: string;
}
