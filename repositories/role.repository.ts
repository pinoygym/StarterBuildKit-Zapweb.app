import { Role, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { RoleFilters } from '@/types/role.types';
import { withErrorHandling, ForbiddenError } from '@/lib/errors';

export class RoleRepository {
  /**
   * Find all roles with optional filters
   */
  async findAll(filters?: RoleFilters) {
    return withErrorHandling(async () => {
      const where: Prisma.RoleWhereInput = {};

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters?.isSystem !== undefined) {
        where.isSystem = filters.isSystem;
      }

      return prisma.role.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    }, 'RoleRepository.findAll');
  }

  /**
   * Find all roles with permissions
   */
  async findAllWithPermissions() {
    return withErrorHandling(async () => {
      const roles = await prisma.role.findMany({
        include: {
          RolePermission: {
            include: {
              Permission: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return roles.map((role: any) => ({
        ...role,
        permissions: role.RolePermission?.map((rp: any) => ({ ...rp, permission: rp.Permission })) || [],
      }));
    }, 'RoleRepository.findAllWithPermissions');
  }

  /**
   * Find role by ID
   */
  async findById(roleId: string) {
    return withErrorHandling(async () => {
      return prisma.role.findUnique({
        where: { id: roleId },
      });
    }, 'RoleRepository.findById');
  }

  /**
   * Find role by ID with permissions
   */
  async findByIdWithPermissions(roleId: string) {
    return withErrorHandling(async () => {
      const row = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          RolePermission: {
            include: {
              Permission: true,
            },
          },
        },
      });
      if (!row) return null as any;
      return {
        ...row,
        permissions: (row as any).RolePermission?.map((rp: any) => ({ ...rp, permission: rp.Permission })) || [],
      } as any;
    }, 'RoleRepository.findByIdWithPermissions');
  }

  /**
   * Find role by name
   */
  async findByName(name: string) {
    return withErrorHandling(async () => {
      return prisma.role.findUnique({
        where: { name },
      });
    }, 'RoleRepository.findByName');
  }

  /**
   * Create new role
   */
  async create(data: Prisma.RoleCreateInput) {
    return withErrorHandling(async () => {
      return prisma.role.create({
        data,
      });
    }, 'RoleRepository.create');
  }

  /**
   * Update role
   */
  async update(roleId: string, data: Prisma.RoleUpdateInput) {
    return withErrorHandling(async () => {
      return prisma.role.update({
        where: { id: roleId },
        data,
      });
    }, 'RoleRepository.update');
  }

  /**
   * Delete role
   */
  async delete(roleId: string) {
    return withErrorHandling(async () => {
      // Check if role is a system role
      const role = await this.findById(roleId);
      if (role?.isSystem) {
        throw new ForbiddenError('Cannot delete system role');
      }

      return prisma.role.delete({
        where: { id: roleId },
      });
    }, 'RoleRepository.delete');
  }

  /**
   * Check if role has users
   */
  async hasUsers(roleId: string) {
    return withErrorHandling(async () => {
      const count = await prisma.user.count({
        where: { roleId },
      });
      return count > 0;
    }, 'RoleRepository.hasUsers');
  }

  /**
   * Get role with user count
   */
  async getRoleWithUserCount(roleId: string) {
    return withErrorHandling(async () => {
      const [role, userCount] = await Promise.all([
        this.findByIdWithPermissions(roleId),
        prisma.user.count({ where: { roleId } }),
      ]);

      return role ? { ...role, userCount } : null;
    }, 'RoleRepository.getRoleWithUserCount');
  }

  /**
   * Find users with specific role
   */
  async findUsersWithRole(roleId: string) {
    return withErrorHandling(async () => {
      return await prisma.user.findMany({
        where: { roleId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });
    }, 'RoleRepository.findUsersWithRole');
  }
}

export const roleRepository = new RoleRepository();
