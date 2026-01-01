import { z } from 'zod';

export const addStockSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  warehouseId: z.string().cuid('Invalid warehouse ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'UOM is required'),
  unitCost: z.number().positive('Unit cost must be greater than 0'),
  batchNumber: z.string().optional(),
  receivedDate: z.date({
    required_error: 'Received date is required',
    invalid_type_error: 'Invalid received date',
  }),
  expiryDate: z.date({
    invalid_type_error: 'Invalid expiry date',
  }).optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
});

export const deductStockSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  warehouseId: z.string().cuid('Invalid warehouse ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'UOM is required'),
  reason: z.string().min(1, 'Reason is required'),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
});

export const transferStockSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  fromWarehouseId: z.string().cuid('Invalid source warehouse ID'),
  toWarehouseId: z.string().cuid('Invalid destination warehouse ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'UOM is required'),
  reason: z.string().min(1, 'Reason is required'),
}).refine(
  (data) => data.fromWarehouseId !== data.toWarehouseId,
  {
    message: 'Source and destination warehouses must be different',
    path: ['toWarehouseId'],
  }
);

export const adjustStockSchema = z.object({
  batchId: z.string().cuid('Invalid batch ID'),
  newQuantity: z.number().nonnegative('Quantity must be zero or greater'),
  reason: z.string().min(1, 'Reason is required'),
});

export type AddStockInput = z.infer<typeof addStockSchema>;
export type DeductStockInput = z.infer<typeof deductStockSchema>;
export type TransferStockInput = z.infer<typeof transferStockSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
