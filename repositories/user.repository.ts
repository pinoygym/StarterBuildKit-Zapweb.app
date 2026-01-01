import { UserStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { UserFilters } from '@/types/user.types';

export class UserRepository {
  /**
   * Find all users with optional filters and pagination
   */
  async findAll(filters?: UserFilters, page = 1, limit = 20) {
    const where: Prisma.UserWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.roleId) {
      where.roleId = filters.roleId;
    }

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: true,
          branch: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find user by ID
   */
  async findById(userId: string) {
    return prisma.user.findUnique({
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
        branch: true,
        branchAccess: {
          include: {
            branch: true,
          },
        },
      },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
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
        branch: true,
      },
    });
  }

  /**
   * Create new user
   */
  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      include: {
        role: true,
        branch: true,
      },
    });
  }

  /**
   * Update user
   */
  async update(userId: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id: userId },
      data,
      include: {
        role: true,
        branch: true,
      },
    });
  }

  /**
   * Delete user
   */
  async delete(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Update user status
   */
  async updateStatus(userId: string, status: UserStatus) {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Update password
   */
  async updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });
  }

  /**
   * Update email verified status
   */
  async updateEmailVerified(userId: string, verified: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { emailVerified: verified },
    });
  }

  /**
   * Find users by branch
   */
  async findByBranch(branchId: string) {
    return prisma.user.findMany({
      where: { branchId },
      include: {
        role: true,
      },
    });
  }

  /**
   * Find users by role
   */
  async findByRole(roleId: string) {
    return prisma.user.findMany({
      where: { roleId },
      include: {
        branch: true,
      },
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeUserId?: string) {
    const where: Prisma.UserWhereInput = { email };
    
    if (excludeUserId) {
      where.id = { not: excludeUserId };
    }

    const count = await prisma.user.count({ where });
    return count > 0;
  }
}

export const userRepository = new UserRepository();
