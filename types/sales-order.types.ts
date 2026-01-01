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
  customerEmail?: string;
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
      basePrice: number | any; // Can be Decimal from Prisma
      status?: string;
      category?: string;
      description?: string | null;
      imageUrl?: string | null;
      minStockLevel?: number;
      shelfLifeDays?: number;
      createdAt?: Date;
      updatedAt?: Date;
    };
  })[];
  warehouse?: any;
  branch?: any;
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
