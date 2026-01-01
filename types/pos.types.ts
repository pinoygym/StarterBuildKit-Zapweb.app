import { POSSale, POSSaleItem } from '@prisma/client';

export type PaymentMethod = 'cash' | 'card' | 'check' | 'gcash' | 'online_transfer' | 'credit';

export interface POSSaleItemInput {
  productId: string;
  quantity: number;
  uom: string;
  originalPrice?: number;
  unitPrice: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  subtotal: number;
  costOfGoodsSold?: number; // Calculated by service
}

export interface CreatePOSSaleInput {
  receiptNumber?: string; // Auto-generated if not provided
  branchId: string;
  warehouseId: string; // Not in schema but needed for inventory deduction
  customerId?: string; // Customer ID for credit sales
  customerName?: string; // Customer name for AR records
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountReason?: string;
  tax: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountReceived?: number; // Required for cash
  partialPayment?: number; // Partial payment amount for credit sales
  change?: number; // Calculated for cash
  convertedFromOrderId?: string; // Sales order ID if converted
  items: POSSaleItemInput[];
}

export type POSSaleWithItems = POSSale & {
  POSSaleItem: (POSSaleItem & {
    Product: {
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
    discountAmount?: number; // Optional discount per item
  })[];
  Branch?: {
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
  Customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  } | null;
  User?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned?: number;
  cashier?: {
    id: string;
    name: string;
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
