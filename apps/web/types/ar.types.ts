import { AccountsReceivable, ARPayment, Branch } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

export interface ARWithPayments extends AccountsReceivable {
  payments: ARPayment[];
  branch: Branch;
  withholdingTax?: number;
  salesDiscount?: number;
  rebates?: number;
  taxExemption?: number;
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
  withholdingTax?: number;
  salesDiscount?: number;
  rebates?: number;
  taxExemption?: number;
  dueDate: Date;
}

export interface RecordARPaymentInput {
  arId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  paymentDate: Date;
  fundSourceId?: string;
  createdById?: string;
}

export interface ARFilters {
  branchId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  customerName?: string;
  customerId?: string;
}

export interface BatchPaymentAllocation {
  arId: string;
  amount: number;
}

export interface RecordBatchPaymentInput {
  customerId: string;
  totalAmount: number;
  paymentMethod: string;
  referenceNumber?: string;
  paymentDate: Date;
  allocations: BatchPaymentAllocation[];
  fundSourceId?: string;
  createdById?: string;
}

export interface ARPaymentReportFilters {
  branchId?: string;
  customerId?: string;
  customerName?: string;
  fromDate?: Date;
  toDate?: Date;
  paymentMethod?: string;
  referenceNumber?: string;
}

export interface ARPaymentReportItem {
  id: string;
  referenceNumber: string | null;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  customerName: string;
  branchName: string;
  branchCode: string;
  arId: string;
  salesOrderId: string | null;
}

export interface ARPaymentReportResponse {
  payments: ARPaymentReportItem[];
  summary: {
    totalAmount: number;
    totalPayments: number;
    byPaymentMethod: {
      method: string;
      count: number;
      amount: number;
    }[];
    byBranch: {
      branchName: string;
      count: number;
      amount: number;
    }[];
  };
}
