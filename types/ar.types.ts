import { AccountsReceivable, ARPayment, Branch } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface ARWithPayments extends AccountsReceivable {
  payments: ARPayment[];
  branch: Branch;
}

export interface ARSummary {
  totalOutstanding: Decimal;
  totalPaid: Decimal;
  totalOverdue: Decimal;
  countPending: number;
  countPartial: number;
  countPaid: number;
  countOverdue: number;
}

export interface ARAgingBucket {
  bucket: '0-30' | '31-60' | '61-90' | '90+';
  count: number;
  totalAmount: Decimal;
}

export interface ARAgingReport {
  buckets: ARAgingBucket[];
  totalOutstanding: Decimal;
  byCustomer: {
    customerName: string;
    total: Decimal;
    aging: ARAgingBucket[];
  }[];
}

export interface CreateARInput {
  branchId: string;
  customerId?: string;
  customerName: string;
  salesOrderId?: string;
  totalAmount: number;
  dueDate: Date;
}

export interface RecordARPaymentInput {
  arId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  paymentDate: Date;
}

export interface ARFilters {
  branchId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  customerName?: string;
}
