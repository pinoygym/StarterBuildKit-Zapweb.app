import { z } from 'zod';

export const salesOrderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'UOM is required'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  subtotal: z.number().positive('Subtotal must be greater than 0'),
});

export const salesOrderSchema = z.object({
  orderNumber: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z
    .string()
    .min(1, 'Customer phone is required')
    .regex(
      /^(\+63|0)?[0-9]{10}$/,
      'Invalid phone number format. Use format: 09XXXXXXXXX or +639XXXXXXXXX'
    ),
  customerEmail: z
    .string()
    .min(1, 'Customer email is required')
    .email('Invalid email format'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  branchId: z.string().uuid('Invalid branch ID'),
  totalAmount: z.number().positive('Total amount must be greater than 0'),
  status: z.enum(['draft', 'pending', 'converted', 'cancelled']).optional(),
  salesOrderStatus: z.enum(['pending', 'converted']).optional(),
  deliveryDate: z.date({
    required_error: 'Delivery date is required',
    invalid_type_error: 'Invalid delivery date',
  }),
  items: z
    .array(salesOrderItemSchema)
    .min(1, 'At least one item is required'),
});

export const updateSalesOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').optional(),
  customerPhone: z
    .string()
    .min(1, 'Customer phone is required')
    .regex(
      /^(\+63|0)?[0-9]{10}$/,
      'Invalid phone number format. Use format: 09XXXXXXXXX or +639XXXXXXXXX'
    )
    .optional(),
  customerEmail: z
    .string()
    .min(1, 'Customer email is required')
    .email('Invalid email format')
    .optional(),
  deliveryAddress: z.string().min(1, 'Delivery address is required').optional(),
  warehouseId: z.string().uuid('Invalid warehouse ID').optional(),
  branchId: z.string().uuid('Invalid branch ID').optional(),
  totalAmount: z.number().positive('Total amount must be greater than 0').optional(),
  status: z.enum(['draft', 'pending', 'converted', 'cancelled']).optional(),
  salesOrderStatus: z.enum(['pending', 'converted']).optional(),
  deliveryDate: z.date({
    invalid_type_error: 'Invalid delivery date',
  }).optional(),
  convertedToSaleId: z.string().uuid('Invalid sale ID').optional(),
  items: z.array(salesOrderItemSchema).min(1, 'At least one item is required').optional(),
});
