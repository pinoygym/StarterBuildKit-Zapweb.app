import type { Customer } from '@prisma/client';

export type CustomerStatus = 'active' | 'inactive';

export type PaymentTerms = 'Net 15' | 'Net 30' | 'Net 60' | 'COD';

export type CustomerType = 'regular' | 'wholesale' | 'retail';

export interface CreateCustomerInput {
  customerCode?: string; // Auto-generated if not provided
  companyName?: string;
  contactPerson: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  paymentTerms?: PaymentTerms;
  creditLimit?: number;
  taxId?: string;
  customerType?: CustomerType;
  notes?: string;
  status?: CustomerStatus;
}

export interface UpdateCustomerInput {
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  paymentTerms?: PaymentTerms;
  creditLimit?: number;
  taxId?: string;
  customerType?: CustomerType;
  notes?: string;
  status?: CustomerStatus;
}

export interface CustomerFilters {
  status?: CustomerStatus;
  customerType?: CustomerType;
  search?: string; // Search by name, email, phone, or customer code
}

export type CustomerWithRelations = Customer & {
  _count?: {
    salesOrders?: number;
    arRecords?: number;
  };
};

export interface CustomerStats {
  totalOrders: number;
  totalRevenue: number;
  outstandingBalance: number;
  lastOrderDate?: Date;
}
