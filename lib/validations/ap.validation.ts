import { z } from 'zod';

export const accountsPayableSchema = z.object({
  branchId: z.string().cuid('Invalid branch ID'),
  supplierId: z.string().cuid('Invalid supplier ID'),
  totalAmount: z.number().positive('Total amount must be greater than 0'),
  paidAmount: z.number().nonnegative('Paid amount must be zero or greater').default(0),
  balance: z.number().nonnegative('Balance must be zero or greater'),
  dueDate: z.date({
    required_error: 'Due date is required',
    invalid_type_error: 'Invalid due date',
  }),
  status: z.enum(['pending', 'partial', 'paid', 'overdue']).default('pending'),
  purchaseOrderId: z.string().cuid('Invalid purchase order ID').optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.balance === data.totalAmount - data.paidAmount,
  {
    message: 'Balance must equal total amount minus paid amount',
    path: ['balance'],
  }
);

export const apPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'card', 'check', 'bank_transfer', 'online_transfer'], {
    required_error: 'Payment method is required',
  }),
  referenceNumber: z.string().optional(),
  paymentDate: z.date({
    required_error: 'Payment date is required',
    invalid_type_error: 'Invalid payment date',
  }),
  notes: z.string().optional(),
});

export const updateAPSchema = z.object({
  totalAmount: z.number().positive('Total amount must be greater than 0').optional(),
  paidAmount: z.number().nonnegative('Paid amount must be zero or greater').optional(),
  balance: z.number().nonnegative('Balance must be zero or greater').optional(),
  dueDate: z.date({
    invalid_type_error: 'Invalid due date',
  }).optional(),
  status: z.enum(['pending', 'partial', 'paid', 'overdue']).optional(),
  notes: z.string().optional(),
});

export type AccountsPayableInput = z.infer<typeof accountsPayableSchema>;
export type APPaymentInput = z.infer<typeof apPaymentSchema>;
export type UpdateAPInput = z.infer<typeof updateAPSchema>;
