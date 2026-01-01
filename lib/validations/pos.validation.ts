import { z } from 'zod';

// Custom validation for IDs that can be either CUID or UUID
const idSchema = z.string().min(1, 'ID is required').refine(
  (val) => {
    // Check if it's a valid CUID (starts with 'c' and is 25 chars) or UUID (36 chars with dashes)
    const isCuid = /^c[a-z0-9]{24}$/.test(val);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    return isCuid || isUuid;
  },
  { message: 'Invalid ID format' }
);

export const posSaleItemSchema = z.object({
  productId: idSchema,
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'UOM is required'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  subtotal: z.number().positive('Subtotal must be greater than 0'),
  cogs: z.number().nonnegative('COGS must be zero or greater').optional(),
});

export const posSaleSchema = z
  .object({
    receiptNumber: z.string().optional(),
    branchId: idSchema,
    warehouseId: idSchema,
    customerId: idSchema.optional(),
    customerName: z.string().min(1, 'Customer name is required for credit sales').optional(),
    subtotal: z.number().positive('Subtotal must be greater than 0'),
    tax: z.number().nonnegative('Tax must be zero or greater'),
    totalAmount: z.number().positive('Total amount must be greater than 0'),
    paymentMethod: z.enum(['cash', 'card', 'check', 'gcash', 'online_transfer', 'credit'], {
      required_error: 'Payment method is required',
      invalid_type_error: 'Invalid payment method',
    }),
    amountReceived: z.number().optional(),
    partialPayment: z.number().optional(),
    change: z.number().optional(),
    convertedFromOrderId: idSchema.optional(),
    items: z.array(posSaleItemSchema).min(1, 'At least one item is required'),
  })
  .superRefine((data, ctx) => {
    // Cash payments: amountReceived must be >= totalAmount
    if (data.paymentMethod === 'cash') {
      if (data.amountReceived == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amountReceived'],
          message: 'Amount received is required for cash payments',
        });
      } else if (data.amountReceived < data.totalAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amountReceived'],
          message: 'Amount received must be greater than or equal to total amount for cash payments',
        });
      }
    }

    // Credit (AR) payments: customer + optional partial payment rules
    if (data.paymentMethod === 'credit') {
      if (!data.customerId || !data.customerName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customerId'],
          message: 'Customer is required for credit payments',
        });
      }

      if (data.partialPayment != null) {
        if (data.partialPayment < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['partialPayment'],
            message: 'Partial payment cannot be negative',
          });
        } else if (data.partialPayment >= data.totalAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['partialPayment'],
            message: 'Partial payment must be less than total amount for credit payments',
          });
        }
      }
    }
  });

export type POSSaleInput = z.infer<typeof posSaleSchema>;
export type POSSaleItemInput = z.infer<typeof posSaleItemSchema>;
