import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/errors';

export class RolePermissionRepository {
  /**
   * Find all role-permission mappings for a role
   */
  async findByRole(roleId: string) {
    return withErrorHandling(async () => {
      return prisma.rolePermission.findMany({
        where: { roleId },
        include: {
          Permission: true,
        },
      });
    }, 'RolePermissionRepository.findByRole');
  }

  /**
   * Find all role-permission mappings for a permission
   */
  async findByPermission(permissionId: string) {
    return withErrorHandling(async () => {
      return prisma.rolePermission.findMany({
        where: { permissionId },
        include: {
          Role: true,
        },
      });
    }, 'RolePermissionRepository.findByPermission');
  }

  /**
   * Create role-permission mapping
   */
  async create(roleId: string, permissionId: string) {
    return withErrorHandling(async () => {
      return prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
        },
      });
    }, 'RolePermissionRepository.create');
  }

  /**
   * Delete role-permission mapping
   */
  async delete(roleId: string, permissionId: string) {
    return withErrorHandling(async () => {
      return prisma.rolePermission.deleteMany({
        where: {
          roleId,
          permissionId,
        },
      });
    }, 'RolePermissionRepository.delete');
  }

  /**
   * Delete all permissions for a role
   */
  async deleteAllByRole(roleId: string) {
    return withErrorHandling(async () => {
      return prisma.rolePermission.deleteMany({
        where: { roleId },
      });
    }, 'RolePermissionRepository.deleteAllByRole');
  }

  /**
   * Bulk create role-permission mappings
   */
  async bulkCreate(roleId: string, permissionIds: string[]) {
    return withErrorHandling(async () => {
      // Delete existing permissions first
      await this.deleteAllByRole(roleId);

      // Create new permissions
      const data = permissionIds.map(permissionId => ({
        roleId,
        permissionId,
      }));

      return prisma.rolePermission.createMany({
        data,
      });
    }, 'RolePermissionRepository.bulkCreate');
  }

  /**
   * Check if role has permission
   */
  async hasPermission(roleId: string, permissionId: string) {
    return withErrorHandling(async () => {
      const count = await prisma.rolePermission.count({
        where: {
          roleId,
          permissionId,
        },
      });

      return count > 0;
    }, 'RolePermissionRepository.hasPermission');
  }
}

export const rolePermissionRepository = new RolePermissionRepository();
