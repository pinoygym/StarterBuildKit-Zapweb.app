import { z } from 'zod';

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'UOM is required'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  branchId: z.string().min(1, 'Branch is required'),
  expectedDeliveryDate: z.date({
    required_error: 'Expected delivery date is required',
  }),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
});

export const updatePurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required').optional(),
  warehouseId: z.string().min(1, 'Warehouse is required').optional(),
  branchId: z.string().min(1, 'Branch is required').optional(),
  expectedDeliveryDate: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required').optional(),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
export type UpdatePurchaseOrderFormData = z.infer<typeof updatePurchaseOrderSchema>;
