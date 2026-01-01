import { Permission, PermissionResource, PermissionAction } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/errors';

export class PermissionRepository {
  /**
   * Find all permissions
   */
  async findAll() {
    return withErrorHandling(async () => {
      return prisma.permission.findMany({
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      });
    }, 'PermissionRepository.findAll');
  }

  /**
   * Find permission by ID
   */
  async findById(permissionId: string) {
    return withErrorHandling(async () => {
      return prisma.permission.findUnique({
        where: { id: permissionId },
      });
    }, 'PermissionRepository.findById');
  }

  /**
   * Find permission by resource and action
   */
  async findByResourceAndAction(resource: PermissionResource, action: PermissionAction) {
    return withErrorHandling(async () => {
      return prisma.permission.findUnique({
        where: {
          resource_action: {
            resource,
            action,
          },
        },
      });
    }, 'PermissionRepository.findByResourceAndAction');
  }

  /**
   * Find permissions by resource
   */
  async findByResource(resource: PermissionResource) {
    return withErrorHandling(async () => {
      return prisma.permission.findMany({
        where: { resource },
        orderBy: { action: 'asc' },
      });
    }, 'PermissionRepository.findByResource');
  }

  /**
   * Get permissions grouped by resource
   */
  async findGroupedByResource() {
    return withErrorHandling(async () => {
      const permissions = await this.findAll();

      const grouped: Record<string, Permission[]> = {};

      for (const permission of permissions) {
        if (!grouped[permission.resource]) {
          grouped[permission.resource] = [];
        }
        grouped[permission.resource].push(permission);
      }

      return grouped;
    }, 'PermissionRepository.findGroupedByResource');
  }

  /**
   * Get permissions for a role
   */
  async findByRoleId(roleId: string) {
    return withErrorHandling(async () => {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId },
        include: {
          Permission: true,
        },
      });

      return rolePermissions.map(rp => rp.Permission);
    }, 'PermissionRepository.findByRoleId');
  }

  /**
   * Get permissions for a user (through their role)
   */
  async findByUserId(userId: string) {
    return withErrorHandling(async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          Role: {
            include: {
              RolePermission: {
                include: {
                  Permission: true,
                },
              },
            },
          },
        },
      });

      if (!user) return [];

      return user.Role.RolePermission.map(rp => rp.Permission);
    }, 'PermissionRepository.findByUserId');
  }
}

export const permissionRepository = new PermissionRepository();
