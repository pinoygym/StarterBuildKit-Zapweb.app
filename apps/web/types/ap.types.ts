import { AccountsPayable, APPayment, Branch, Supplier, Prisma } from '@prisma/client';

export interface APWithPayments extends AccountsPayable {
  payments: APPayment[];
  branch: Branch;
  supplier: Supplier;
}

export interface APSummary {
  totalOutstanding: Prisma.Decimal;
  totalPaid: Prisma.Decimal;
  totalOverdue: Prisma.Decimal;
  countPending: number;
  countPartial: number;
  countPaid: number;
  countOverdue: number;
}

export interface APAgingBucket {
  bucket: '0-30' | '31-60' | '61-90' | '90+';
  count: number;
  totalAmount: Prisma.Decimal;
}

export interface APAgingReport {
  buckets: APAgingBucket[];
  totalOutstanding: Prisma.Decimal;
  bySupplier: {
    supplierName: string;
    total: Prisma.Decimal;
    aging: APAgingBucket[];
  }[];
}

export interface CreateAPInput {
  branchId: string;
  supplierId: string;
  purchaseOrderId?: string;
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  otherCharges?: number;
  withholdingTax?: number;
  salesDiscount?: number;
  rebates?: number;
  taxExemption?: number;
  dueDate: Date;
}

export interface RecordAPPaymentInput {
  apId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  paymentDate: Date;
  fundSourceId?: string;
  createdById?: string;
}

export interface APFilters {
  branchId?: string;
  supplierId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface BatchPaymentAllocation {
  apId: string;
  amount: number;
}

export interface RecordBatchAPPaymentInput {
  supplierId: string;
  totalAmount: number;
  paymentMethod: string;
  referenceNumber?: string;
  paymentDate: Date;
  allocations: BatchPaymentAllocation[];
  fundSourceId?: string;
  createdById?: string;
}
