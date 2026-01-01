import { z } from 'zod';

// Base schema for all reference data
const baseReferenceDataSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(20, 'Code must be 20 characters or less')
    .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and hyphens'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  displayOrder: z.number().int().min(0).default(0),
  isSystemDefined: z.boolean().default(false),
});

// Product Category
export const createProductCategorySchema = baseReferenceDataSchema;

export const updateProductCategorySchema = baseReferenceDataSchema.partial();

// Expense Category
export const createExpenseCategorySchema = baseReferenceDataSchema;

export const updateExpenseCategorySchema = baseReferenceDataSchema.partial();

// Payment Method
export const createPaymentMethodSchema = baseReferenceDataSchema.extend({
  applicableTo: z
    .array(z.enum(['expense', 'pos', 'ar', 'ap']))
    .min(1, 'Select at least one applicable context')
    .default(['expense', 'pos', 'ar', 'ap']),
});

export const updatePaymentMethodSchema = createPaymentMethodSchema.partial();

// Unit of Measure
export const createUnitOfMeasureSchema = baseReferenceDataSchema;

export const updateUnitOfMeasureSchema = baseReferenceDataSchema.partial();

// Expense Vendor
export const createExpenseVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(200, 'Name must be 200 characters or less'),
  contactPerson: z.string().max(100, 'Contact person must be 100 characters or less').optional(),
  phone: z
    .string()
    .max(20, 'Phone must be 20 characters or less')
    .regex(/^[\d\s\-\(\)\+]*$/, 'Invalid phone format')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email format').max(100, 'Email must be 100 characters or less').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
  displayOrder: z.number().int().min(0).default(0),
});

export const updateExpenseVendorSchema = createExpenseVendorSchema.partial();

// Validation helper type
export type CreateProductCategorySchema = z.infer<typeof createProductCategorySchema>;
export type CreateExpenseCategorySchema = z.infer<typeof createExpenseCategorySchema>;
export type CreatePaymentMethodSchema = z.infer<typeof createPaymentMethodSchema>;
export type CreateUnitOfMeasureSchema = z.infer<typeof createUnitOfMeasureSchema>;
export type CreateExpenseVendorSchema = z.infer<typeof createExpenseVendorSchema>;
