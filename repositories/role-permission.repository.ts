import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export class RolePermissionRepository {
  /**
   * Find all role-permission mappings for a role
   */
  async findByRole(roleId: string) {
    return prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        Permission: true,
      },
    });
  }

  /**
   * Find all role-permission mappings for a permission
   */
  async findByPermission(permissionId: string) {
    return prisma.rolePermission.findMany({
      where: { permissionId },
      include: {
        Role: true,
      },
    });
  }

  /**
   * Create role-permission mapping
   */
  async create(roleId: string, permissionId: string) {
    return prisma.rolePermission.create({
      data: {
        id: randomUUID(),
        roleId,
        permissionId,
      },
    });
  }

  /**
   * Delete role-permission mapping
   */
  async delete(roleId: string, permissionId: string) {
    return prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });
  }

  /**
   * Delete all permissions for a role
   */
  async deleteAllByRole(roleId: string) {
    return prisma.rolePermission.deleteMany({
      where: { roleId },
    });
  }

  /**
   * Bulk create role-permission mappings
   */
  async bulkCreate(roleId: string, permissionIds: string[]) {
    // Delete existing permissions first
    await this.deleteAllByRole(roleId);

    // Create new permissions
    const data = permissionIds.map(permissionId => ({
      id: randomUUID(),
      roleId,
      permissionId,
      updatedAt: new Date(),
    }));

    return prisma.rolePermission.createMany({
      data,
    });
  }

  /**
   * Check if role has permission
   */
  async hasPermission(roleId: string, permissionId: string) {
    const count = await prisma.rolePermission.count({
      where: {
        roleId,
        permissionId,
      },
    });

    return count > 0;
  }

  /**
   * Alias for findByRole - for compatibility
   */
  async findByRoleId(roleId: string) {
    return this.findByRole(roleId);
  }

  /**
   * Alias for deleteAllByRole - for compatibility
   */
  async deleteByRoleId(roleId: string) {
    return this.deleteAllByRole(roleId);
  }
}

export const rolePermissionRepository = new RolePermissionRepository();
