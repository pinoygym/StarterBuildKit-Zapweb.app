import { PrismaClient, Permission, PermissionResource, PermissionAction } from '@prisma/client';

const prisma = new PrismaClient();

export class PermissionRepository {
  /**
   * Find all permissions
   */
  async findAll() {
    return prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  /**
   * Find permission by ID
   */
  async findById(permissionId: string) {
    return prisma.permission.findUnique({
      where: { id: permissionId },
    });
  }

  /**
   * Find permission by resource and action
   */
  async findByResourceAndAction(resource: PermissionResource, action: PermissionAction) {
    return prisma.permission.findUnique({
      where: {
        resource_action: {
          resource,
          action,
        },
      },
    });
  }

  /**
   * Find permissions by resource
   */
  async findByResource(resource: PermissionResource) {
    return prisma.permission.findMany({
      where: { resource },
      orderBy: { action: 'asc' },
    });
  }

  /**
   * Get permissions grouped by resource
   */
  async findGroupedByResource() {
    const permissions = await this.findAll();
    
    const grouped: Record<string, Permission[]> = {};
    
    for (const permission of permissions) {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    }

    return grouped;
  }

  /**
   * Get permissions for a role
   */
  async findByRoleId(roleId: string) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map(rp => rp.permission);
  }

  /**
   * Get permissions for a user (through their role)
   */
  async findByUserId(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) return [];

    return user.role.permissions.map(rp => rp.permission);
  }
}

export const permissionRepository = new PermissionRepository();
