import { z } from 'zod';

export const posSaleItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'UOM is required'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  subtotal: z.number().positive('Subtotal must be greater than 0'),
  cogs: z.number().nonnegative('COGS must be zero or greater').optional(),
});

export const posSaleSchema = z.object({
  receiptNumber: z.string().optional(),
  branchId: z.string().uuid('Invalid branch ID'),
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  subtotal: z.number().positive('Subtotal must be greater than 0'),
  tax: z.number().nonnegative('Tax must be zero or greater'),
  totalAmount: z.number().positive('Total amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'card', 'check', 'gcash', 'online_transfer'], {
    required_error: 'Payment method is required',
    invalid_type_error: 'Invalid payment method',
  }),
  amountReceived: z.number().optional(),
  change: z.number().optional(),
  convertedFromOrderId: z.string().uuid('Invalid order ID').optional(),
  items: z
    .array(posSaleItemSchema)
    .min(1, 'At least one item is required'),
}).refine(
  (data) => {
    // If payment method is cash, amountReceived must be >= totalAmount
    if (data.paymentMethod === 'cash' && data.amountReceived) {
      return data.amountReceived >= data.totalAmount;
    }
    return true;
  },
  {
    message: 'Amount received must be greater than or equal to total amount for cash payments',
    path: ['amountReceived'],
  }
);

export type POSSaleInput = z.infer<typeof posSaleSchema>;
export type POSSaleItemInput = z.infer<typeof posSaleItemSchema>;
