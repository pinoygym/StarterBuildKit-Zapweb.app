import { z } from 'zod';

/**
 * Validation schema for creating a role
 */
export const roleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .min(2, 'Role name must be at least 2 characters')
    .max(100, 'Role name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .nullable(),
  isSystem: z.boolean().optional().default(false),
});

/**
 * Validation schema for updating a role
 */
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Role name must be at least 2 characters')
    .max(100, 'Role name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .nullable(),
});

/**
 * Validation schema for assigning permissions to a role
 */
export const assignPermissionsSchema = z.object({
  permissionIds: z
    .array(z.string().uuid('Invalid permission ID format'))
    .min(0, 'At least one permission must be provided')
    .default([]),
});

/**
 * Type exports
 */
export type RoleInput = z.infer<typeof roleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;
