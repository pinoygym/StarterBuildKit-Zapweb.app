import { Supplier } from '@prisma/client';

export type SupplierStatus = 'active' | 'inactive';

export type PaymentTerms = 'Net 3' | 'Net 7' | 'Net 15' | 'Net 30' | 'Net 60' | 'COD';

export interface CreateSupplierInput {
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  taxId?: string;
  paymentTerms: PaymentTerms;
  status?: SupplierStatus;
}

export interface UpdateSupplierInput {
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  paymentTerms?: PaymentTerms;
  status?: SupplierStatus;
}

export interface SupplierFilters {
  status?: SupplierStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export type SupplierWithRelations = Supplier;
