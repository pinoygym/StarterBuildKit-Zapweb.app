import { z } from 'zod';

export const expenseSchema = z.object({
  branchId: z.string().uuid('Invalid branch ID'),
  expenseDate: z.date({
    required_error: 'Expense date is required',
    invalid_type_error: 'Invalid expense date',
  }),
  category: z.enum(
    ['Utilities', 'Rent', 'Salaries', 'Transportation', 'Marketing', 'Maintenance', 'Other'],
    {
      required_error: 'Category is required',
      invalid_type_error: 'Invalid category',
    }
  ),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  vendor: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'check', 'online_transfer'], {
    required_error: 'Payment method is required',
    invalid_type_error: 'Invalid payment method',
  }),
  receiptUrl: z.string().url('Invalid receipt URL').optional(),
});

export const updateExpenseSchema = z.object({
  expenseDate: z.date({
    invalid_type_error: 'Invalid expense date',
  }).optional(),
  category: z.enum(
    ['Utilities', 'Rent', 'Salaries', 'Transportation', 'Marketing', 'Maintenance', 'Other']
  ).optional(),
  amount: z.number().positive('Amount must be greater than 0').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  vendor: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'check', 'online_transfer']).optional(),
  receiptUrl: z.string().url('Invalid receipt URL').optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
