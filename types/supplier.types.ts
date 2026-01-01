import { Supplier } from '@prisma/client';

export type SupplierStatus = 'active' | 'inactive';

export type PaymentTerms = 'Net 15' | 'Net 30' | 'Net 60' | 'COD';

export interface CreateSupplierInput {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  paymentTerms: PaymentTerms;
  status?: SupplierStatus;
}

export interface UpdateSupplierInput {
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  paymentTerms?: PaymentTerms;
  status?: SupplierStatus;
}

export interface SupplierFilters {
  status?: SupplierStatus;
  search?: string;
}

export type SupplierWithRelations = Supplier;
