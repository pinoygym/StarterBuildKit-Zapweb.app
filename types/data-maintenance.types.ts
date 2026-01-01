import {
  ProductCategory,
  ExpenseCategory,
  PaymentMethod,
  UnitOfMeasure,
  ExpenseVendor,
} from '@prisma/client';

// Common reference data interface
export interface ReferenceDataBase {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: string;
  displayOrder: number;
  isSystemDefined: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Reference data types
export type ReferenceDataType =
  | 'product-categories'
  | 'expense-categories'
  | 'payment-methods'
  | 'units-of-measure'
  | 'expense-vendors';

// Type mapping for reference data
export type ReferenceDataModel<T extends ReferenceDataType> = T extends 'product-categories'
  ? ProductCategory
  : T extends 'expense-categories'
  ? ExpenseCategory
  : T extends 'payment-methods'
  ? PaymentMethod
  : T extends 'units-of-measure'
  ? UnitOfMeasure
  : T extends 'expense-vendors'
  ? ExpenseVendor
  : never;

// Create inputs
export interface CreateProductCategoryInput {
  name: string;
  code: string;
  description?: string;
  status?: string;
  displayOrder?: number;
  isSystemDefined?: boolean;
}

export interface CreateExpenseCategoryInput {
  name: string;
  code: string;
  description?: string;
  status?: string;
  displayOrder?: number;
  isSystemDefined?: boolean;
}

export interface CreatePaymentMethodInput {
  name: string;
  code: string;
  description?: string;
  status?: string;
  displayOrder?: number;
  isSystemDefined?: boolean;
  applicableTo?: string[];
}

export interface CreateUnitOfMeasureInput {
  name: string;
  code: string;
  description?: string;
  status?: string;
  displayOrder?: number;
  isSystemDefined?: boolean;
}

export interface CreateExpenseVendorInput {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  status?: string;
  displayOrder?: number;
}

// Update inputs
export interface UpdateProductCategoryInput extends Partial<CreateProductCategoryInput> {}
export interface UpdateExpenseCategoryInput extends Partial<CreateExpenseCategoryInput> {}
export interface UpdatePaymentMethodInput extends Partial<CreatePaymentMethodInput> {}
export interface UpdateUnitOfMeasureInput extends Partial<CreateUnitOfMeasureInput> {}
export interface UpdateExpenseVendorInput extends Partial<CreateExpenseVendorInput> {}

// Filters
export interface ReferenceDataFilters {
  status?: string;
  search?: string;
}

// Response types
export interface ReferenceDataListResponse<T> {
  data: T[];
  total: number;
}

// Reference data configuration
export interface ReferenceDataConfig {
  type: ReferenceDataType;
  title: string;
  singularTitle: string;
  description: string;
  icon: string;
  hasApplicableTo?: boolean;
  hasVendorFields?: boolean;
  fields: ReferenceDataField[];
}

export interface ReferenceDataField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'phone' | 'multiselect';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

// Metadata for each reference data type
export const REFERENCE_DATA_CONFIGS: Record<ReferenceDataType, ReferenceDataConfig> = {
  'product-categories': {
    type: 'product-categories',
    title: 'Product Categories',
    singularTitle: 'Product Category',
    description: 'Manage product categories for inventory classification',
    icon: 'Package',
    fields: [
      { name: 'name', label: 'Category Name', type: 'text', required: true, placeholder: 'e.g., Carbonated Drinks' },
      { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., CARB' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
    ],
  },
  'expense-categories': {
    type: 'expense-categories',
    title: 'Expense Categories',
    singularTitle: 'Expense Category',
    description: 'Manage expense categories for financial tracking',
    icon: 'DollarSign',
    fields: [
      { name: 'name', label: 'Category Name', type: 'text', required: true, placeholder: 'e.g., Utilities' },
      { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., UTIL' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
    ],
  },
  'payment-methods': {
    type: 'payment-methods',
    title: 'Payment Methods',
    singularTitle: 'Payment Method',
    description: 'Manage payment methods for transactions',
    icon: 'CreditCard',
    hasApplicableTo: true,
    fields: [
      { name: 'name', label: 'Method Name', type: 'text', required: true, placeholder: 'e.g., Cash' },
      { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., CASH' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
      {
        name: 'applicableTo',
        label: 'Applicable To',
        type: 'multiselect',
        options: [
          { label: 'Expenses', value: 'expense' },
          { label: 'POS Sales', value: 'pos' },
          { label: 'Accounts Receivable', value: 'ar' },
          { label: 'Accounts Payable', value: 'ap' },
        ],
      },
    ],
  },
  'units-of-measure': {
    type: 'units-of-measure',
    title: 'Units of Measure',
    singularTitle: 'Unit of Measure',
    description: 'Manage units of measure for products',
    icon: 'Ruler',
    fields: [
      { name: 'name', label: 'UOM Name', type: 'text', required: true, placeholder: 'e.g., Piece' },
      { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., PC' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
    ],
  },
  'expense-vendors': {
    type: 'expense-vendors',
    title: 'Expense Vendors',
    singularTitle: 'Expense Vendor',
    description: 'Manage common expense vendors for quick entry',
    icon: 'Store',
    hasVendorFields: true,
    fields: [
      { name: 'name', label: 'Vendor Name', type: 'text', required: true, placeholder: 'e.g., Manila Electric Company' },
      { name: 'contactPerson', label: 'Contact Person', type: 'text', placeholder: 'Optional' },
      { name: 'phone', label: 'Phone', type: 'phone', placeholder: 'Optional' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional' },
    ],
  },
};
