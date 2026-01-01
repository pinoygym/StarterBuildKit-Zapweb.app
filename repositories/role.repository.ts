import { Role, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { RoleFilters } from '@/types/role.types';

export class RoleRepository {
  /**
   * Find all roles with optional filters
   */
  async findAll(filters?: RoleFilters) {
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
  }

  /**
   * Find role by ID
   */
  async findById(roleId: string) {
    return prisma.role.findUnique({
      where: { id: roleId },
    });
  }

  /**
   * Find role by ID with permissions
   */
  async findByIdWithPermissions(roleId: string) {
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
  }

  /**
   * Find role by name
   */
  async findByName(name: string) {
    return prisma.role.findUnique({
      where: { name },
    });
  }

  /**
   * Create new role
   */
  async create(data: Prisma.RoleCreateInput) {
    return prisma.role.create({
      data,
    });
  }

  /**
   * Update role
   */
  async update(roleId: string, data: Prisma.RoleUpdateInput) {
    return prisma.role.update({
      where: { id: roleId },
      data,
    });
  }

  /**
   * Delete role
   */
  async delete(roleId: string) {
    // Check if role is a system role
    const role = await this.findById(roleId);
    if (role?.isSystem) {
      throw new Error('Cannot delete system role');
    }

    return prisma.role.delete({
      where: { id: roleId },
    });
  }

  /**
   * Check if role has users
   */
  async hasUsers(roleId: string) {
    const count = await prisma.user.count({
      where: { roleId },
    });
    return count > 0;
  }

  /**
   * Get role with user count
   */
  async getRoleWithUserCount(roleId: string) {
    const [role, userCount] = await Promise.all([
      this.findByIdWithPermissions(roleId),
      prisma.user.count({ where: { roleId } }),
    ]);

    return role ? { ...role, userCount } : null;
  }
}

export const roleRepository = new RoleRepository();
