import { z } from 'zod';

const paymentTermsEnum = z.enum(['Net 15', 'Net 30', 'Net 60', 'COD']);
const customerTypeEnum = z.enum(['regular', 'wholesale', 'retail']);
const statusEnum = z.enum(['active', 'inactive']);

export const customerSchema = z.object({
  customerCode: z.string().optional(),
  companyName: z.string().max(255).optional(),
  contactPerson: z
    .string()
    .min(1, 'Contact person is required')
    .max(255, 'Contact person name is too long'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  paymentTerms: paymentTermsEnum.default('Net 30'),
  creditLimit: z
    .number()
    .nonnegative('Credit limit must be non-negative')
    .optional(),
  taxId: z.string().max(50).optional(),
  customerType: customerTypeEnum.default('regular'),
  notes: z.string().max(1000).optional(),
  status: statusEnum.default('active'),
});

export const updateCustomerSchema = z.object({
  companyName: z.string().max(255).optional(),
  contactPerson: z.string().min(1).max(255).optional(),
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .optional(),
  email: z.string().email('Invalid email format').optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  paymentTerms: paymentTermsEnum.optional(),
  creditLimit: z
    .number()
    .nonnegative('Credit limit must be non-negative')
    .optional(),
  taxId: z.string().max(50).optional(),
  customerType: customerTypeEnum.optional(),
  notes: z.string().max(1000).optional(),
  status: statusEnum.optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type UpdateCustomerFormData = z.infer<typeof updateCustomerSchema>;
