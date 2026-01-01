import { SalesOrder, SalesOrderItem } from '@prisma/client';

export type SalesOrderStatus = 'draft' | 'pending' | 'converted' | 'cancelled';
export type SalesOrderConversionStatus = 'pending' | 'converted';

export interface SalesOrderItemInput {
  productId: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  subtotal: number;
}

export interface CreateSalesOrderInput {
  orderNumber?: string; // Auto-generated if not provided
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  warehouseId: string;
  branchId: string;
  totalAmount: number;
  status?: SalesOrderStatus;
  salesOrderStatus?: SalesOrderConversionStatus;
  deliveryDate: Date;
  items: SalesOrderItemInput[];
}

export interface UpdateSalesOrderInput {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  warehouseId?: string;
  branchId?: string;
  totalAmount?: number;
  status?: SalesOrderStatus;
  salesOrderStatus?: SalesOrderConversionStatus;
  deliveryDate?: Date;
  convertedToSaleId?: string;
  items?: SalesOrderItemInput[];
}

export type SalesOrderWithItems = SalesOrder & {
  items: (SalesOrderItem & {
    product?: {
      id: string;
      name: string;
      baseUOM: string;
      basePrice: number;
    };
  })[];
};

export interface SalesOrderFilters {
  status?: SalesOrderStatus;
  salesOrderStatus?: SalesOrderConversionStatus;
  branchId?: string;
  warehouseId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string; // Search by customer name or order number
}
