import { z } from 'zod';

export const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(100, 'Warehouse name is too long'),
  location: z.string().min(1, 'Location is required').max(200, 'Location is too long'),
  manager: z.string().min(1, 'Manager name is required').max(100, 'Manager name is too long'),
  maxCapacity: z.number().int().positive('Maximum capacity must be greater than 0'),
  branchId: z.string().uuid('Invalid branch ID'),
});

export const updateWarehouseSchema = warehouseSchema.partial();

export type WarehouseFormData = z.infer<typeof warehouseSchema>;
export type UpdateWarehouseFormData = z.infer<typeof updateWarehouseSchema>;
