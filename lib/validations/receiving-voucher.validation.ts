import { z } from 'zod';

export const receivingVoucherItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  orderedQuantity: z.number().positive('Ordered quantity must be positive'),
  receivedQuantity: z.number().min(0, 'Received quantity cannot be negative'),
  varianceReason: z.string().optional(),
  unitPrice: z.number().positive('Unit price must be positive'),
});

export const createReceivingVoucherSchema = z.object({
  purchaseOrderId: z.string().uuid('Invalid purchase order ID'),
  receiverName: z.string().min(1, 'Receiver name is required').max(100, 'Receiver name too long'),
  deliveryNotes: z.string().max(500, 'Delivery notes too long').optional(),
  items: z
    .array(receivingVoucherItemSchema)
    .min(1, 'At least one item is required')
    .refine(
      (items) => items.some((item) => item.receivedQuantity > 0),
      'At least one item must have received quantity greater than zero'
    ),
});

export const receivingVoucherFiltersSchema = z.object({
  branchId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  rvNumber: z.string().optional(),
  poNumber: z.string().optional(),
});

export type CreateReceivingVoucherInput = z.infer<typeof createReceivingVoucherSchema>;
export type ReceivingVoucherFilters = z.infer<typeof receivingVoucherFiltersSchema>;
