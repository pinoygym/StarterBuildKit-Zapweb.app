import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { UserFilters } from '@/types/user.types';
import { withErrorHandling } from '@/lib/errors';

export class UserRepository {
  /**
   * Find all users with optional filters and pagination
   */
  async findAll(filters?: UserFilters, page = 1, limit = 20) {
    return withErrorHandling(async () => {
      const where: Prisma.UserWhereInput = {};

      if (!filters?.includeSuperMegaAdmin) {
        where.isSuperMegaAdmin = false;
      }

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
            Role: true,
            Branch: true,
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
    }, 'UserRepository.findAll');
  }

  /**
   * Find user by ID
   */
  async findById(userId: string) {
    return withErrorHandling(async () => {
      return prisma.user.findUnique({
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
          Branch: true,
          UserBranchAccess: {
            include: {
              Branch: true,
            },
          },
        },
      });
    }, 'UserRepository.findById');
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return withErrorHandling(async () => {
      return prisma.user.findUnique({
        where: { email },
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
          Branch: true,
        },
      });
    }, 'UserRepository.findByEmail');
  }

  /**
   * Create new user
   */
  async create(data: Prisma.UserCreateInput) {
    return withErrorHandling(async () => {
      return prisma.user.create({
        data,
        include: {
          Role: true,
          Branch: true,
        },
      });
    }, 'UserRepository.create');
  }

  /**
   * Update user
   */
  async update(userId: string, data: Prisma.UserUpdateInput) {
    return withErrorHandling(async () => {
      return prisma.user.update({
        where: { id: userId },
        data,
        include: {
          Role: true,
          Branch: true,
        },
      });
    }, 'UserRepository.update');
  }

  /**
   * Delete user
   */
  async delete(userId: string) {
    return withErrorHandling(async () => {
      return prisma.user.delete({
        where: { id: userId },
      });
    }, 'UserRepository.delete');
  }

  /**
   * Update user status
   */
  async updateStatus(userId: string, status: string) {
    return withErrorHandling(async () => {
      return prisma.user.update({
        where: { id: userId },
        data: { status },
      });
    }, 'UserRepository.updateStatus');
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string) {
    return withErrorHandling(async () => {
      return prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });
    }, 'UserRepository.updateLastLogin');
  }

  /**
   * Update password
   */
  async updatePassword(userId: string, passwordHash: string) {
    return withErrorHandling(async () => {
      return prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
        },
      });
    }, 'UserRepository.updatePassword');
  }

  /**
   * Update email verified status
   */
  async updateEmailVerified(userId: string, verified: boolean) {
    return withErrorHandling(async () => {
      return prisma.user.update({
        where: { id: userId },
        data: { emailVerified: verified },
      });
    }, 'UserRepository.updateEmailVerified');
  }

  /**
   * Find users by branch
   */
  async findByBranch(branchId: string) {
    return withErrorHandling(async () => {
      return prisma.user.findMany({
        where: { branchId },
        include: {
          Role: true,
        },
      });
    }, 'UserRepository.findByBranch');
  }

  /**
   * Find users by role
   */
  async findByRole(roleId: string) {
    return withErrorHandling(async () => {
      return prisma.user.findMany({
        where: { roleId },
        include: {
          Branch: true,
        },
      });
    }, 'UserRepository.findByRole');
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeUserId?: string) {
    return withErrorHandling(async () => {
      const where: Prisma.UserWhereInput = { email };

      if (excludeUserId) {
        where.id = { not: excludeUserId };
      }

      const count = await prisma.user.count({ where });
      return count > 0;
    }, 'UserRepository.emailExists');
  }
}

export const userRepository = new UserRepository();
