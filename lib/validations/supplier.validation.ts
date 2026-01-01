import { z } from 'zod';

export const supplierSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200, 'Company name is too long'),
  contactPerson: z.string().min(1, 'Contact person is required').max(100, 'Contact person name is too long'),
  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  paymentTerms: z.enum(['Net 15', 'Net 30', 'Net 60', 'COD'], {
    errorMap: () => ({ message: 'Invalid payment terms' })
  }),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const updateSupplierSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200, 'Company name is too long').optional(),
  contactPerson: z.string().min(1, 'Contact person is required').max(100, 'Contact person name is too long').optional(),
  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .optional(),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .optional(),
  paymentTerms: z.enum(['Net 15', 'Net 30', 'Net 60', 'COD'], {
    errorMap: () => ({ message: 'Invalid payment terms' })
  }).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>;
