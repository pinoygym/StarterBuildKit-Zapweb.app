import { POSSale, POSSaleItem } from '@prisma/client';

export type PaymentMethod = 'cash' | 'card' | 'check' | 'gcash' | 'online_transfer';

export interface POSSaleItemInput {
  productId: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  subtotal: number;
  costOfGoodsSold?: number; // Calculated by service
}

export interface CreatePOSSaleInput {
  receiptNumber?: string; // Auto-generated if not provided
  branchId: string;
  warehouseId: string; // Not in schema but needed for inventory deduction
  subtotal: number;
  tax: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountReceived?: number; // Required for cash
  change?: number; // Calculated for cash
  convertedFromOrderId?: string; // Sales order ID if converted
  items: POSSaleItemInput[];
}

export type POSSaleWithItems = POSSale & {
  items: (POSSaleItem & {
    product: {
      id: string;
      name: string;
      description: string | null;
      category: string;
      imageUrl: string | null;
      basePrice: any;
      baseUOM: string;
      minStockLevel: number;
      shelfLifeDays: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    };
  })[];
  branch?: {
    id: string;
    name: string;
    code: string;
    location: string;
    manager: string;
    phone: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

export interface POSSaleFilters {
  branchId?: string;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  search?: string; // Search by receipt number
}

export interface POSTodaySummary {
  transactionCount: number;
  totalRevenue: number;
  averageSaleValue: number;
}

export interface ProductWithStock {
  id: string;
  name: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  basePrice: number;
  baseUOM: string;
  status: string;
  alternateUOMs: Array<{
    id: string;
    name: string;
    conversionFactor: number;
    sellingPrice: number;
  }>;
  currentStock: number; // Aggregated stock across all batches
  inStock: boolean;
}
