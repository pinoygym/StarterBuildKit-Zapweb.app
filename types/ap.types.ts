import { AccountsPayable, APPayment, Branch, Supplier } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface APWithPayments extends AccountsPayable {
  payments: APPayment[];
  branch: Branch;
  supplier: Supplier;
}

export interface APSummary {
  totalOutstanding: Decimal;
  totalPaid: Decimal;
  totalOverdue: Decimal;
  countPending: number;
  countPartial: number;
  countPaid: number;
  countOverdue: number;
}

export interface APAgingBucket {
  bucket: '0-30' | '31-60' | '61-90' | '90+';
  count: number;
  totalAmount: Decimal;
}

export interface APAgingReport {
  buckets: APAgingBucket[];
  totalOutstanding: Decimal;
  bySupplier: {
    supplierName: string;
    total: Decimal;
    aging: APAgingBucket[];
  }[];
}

export interface CreateAPInput {
  branchId: string;
  supplierId: string;
  purchaseOrderId?: string;
  totalAmount: number;
  dueDate: Date;
}

export interface RecordAPPaymentInput {
  apId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  paymentDate: Date;
}

export interface APFilters {
  branchId?: string;
  supplierId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}
