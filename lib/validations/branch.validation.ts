import { z } from 'zod';

export const branchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(100, 'Branch name is too long'),
  code: z.string().min(1, 'Branch code is required').max(20, 'Branch code is too long'),
  location: z.string().min(1, 'Location is required').max(200, 'Location is too long'),
  manager: z.string().min(1, 'Manager name is required').max(100, 'Manager name is too long'),
  phone: z.string().min(1, 'Phone number is required').regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const updateBranchSchema = branchSchema.partial();

export type BranchFormData = z.infer<typeof branchSchema>;
export type UpdateBranchFormData = z.infer<typeof updateBranchSchema>;
