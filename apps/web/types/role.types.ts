import { Role, Permission, RolePermission, PermissionResource, PermissionAction } from '@prisma/client';

// Base Role and Permission types
export type { Role, Permission, RolePermission, PermissionResource, PermissionAction };

// Role with relations
export type RoleWithPermissions = Role & {
  permissions: (RolePermission & {
    permission: Permission;
  })[];
};

export type RoleWithUsers = Role & {
  users: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }[];
};

// Permission with relations
export type PermissionWithRoles = Permission & {
  roles: (RolePermission & {
    role: Role;
  })[];
};

// Role input types
export interface CreateRoleInput {
  name: string;
  description?: string;
  isSystem?: boolean;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
}

export interface AssignPermissionsInput {
  permissionIds: string[];
}

// Role filter types
export interface RoleFilters {
  search?: string;
  isSystem?: boolean;
}

// Role response types
export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleWithPermissionsResponse extends RoleResponse {
  permissions: PermissionResponse[];
  permissionCount: number;
}

// Permission response types
export interface PermissionResponse {
  id: string;
  resource: PermissionResource;
  action: PermissionAction;
  description: string | null;
  createdAt: Date;
}

// Grouped permissions
export interface GroupedPermissions {
  [resource: string]: PermissionResponse[];
}

// Permission check result
export interface PermissionCheckResult {
  hasPermission: boolean;
  permission?: Permission;
}

// Permission key format: resource:action
export type PermissionKey = `${PermissionResource}:${PermissionAction}`;
