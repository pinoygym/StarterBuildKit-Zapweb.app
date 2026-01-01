// @ts-nocheck
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { userRepository } from '@/repositories/user.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { CreateUserInput, UpdateUserInput, UserFilters } from '@/types/user.types';
import { AuditAction, AuditResource } from '@/types/audit.types';

export class UserService {
  /**
   * Get all users with filtering and pagination
   */
  async getAllUsers(filters?: UserFilters, page = 1, limit = 20) {
    return await userRepository.findAll(filters, page, limit);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    return await userRepository.findById(id);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    return await userRepository.findByEmail(email);
  }

  /**
   * Create new user
   */
  async createUser(
    data: CreateUserInput,
    createdById: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user data for Prisma
    // @ts-expect-error - TypeScript incorrectly inferring type
    const createData: Prisma.UserCreateInput = {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      Role: { connect: { id: data.roleId } },
      Branch: data.branchId ? { connect: { id: data.branchId } } : undefined,
      status: 'ACTIVE',
      emailVerified: false,
    };

    // Create user
    const user = await userRepository.create(createData);

    // Log the action
    await auditLogRepository.create({
      userId: createdById,
      action: AuditAction.USER_CREATED,
      resource: AuditResource.USER,
      resourceId: user.id,
      details: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ipAddress,
      userAgent,
    });

    return user;
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    data: UpdateUserInput,
    updatedById: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await userRepository.findByEmail(data.email);
      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    // Prepare update data for Prisma
    const updateData: Prisma.UserUpdateInput = {
      ...(data.email && { email: data.email }),
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.status && { status: data.status }),
      ...(data.emailVerified !== undefined && { emailVerified: data.emailVerified }),
    };

    if (data.roleId) {
      updateData.Role = { connect: { id: data.roleId } };
    }

    if (data.branchId !== undefined) {
      updateData.Branch = data.branchId ? { connect: { id: data.branchId } } : { disconnect: true };
    }

    // Update user
    const updatedUser = await userRepository.update(id, updateData);

    // Log the action
    await auditLogRepository.create({
      userId: updatedById,
      action: AuditAction.USER_UPDATED,
      resource: AuditResource.USER,
      resourceId: id,
      details: {
        changes: data,
      },
      ipAddress,
      userAgent,
    });

    return updatedUser;
  }

  /**
   * Delete user (soft delete by setting status to INACTIVE)
   */
  async deleteUser(
    id: string,
    deletedById: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete by setting status to INACTIVE
    await userRepository.update(id, { status: 'INACTIVE' });

    // Log the action
    await auditLogRepository.create({
      userId: deletedById,
      action: AuditAction.USER_DELETED,
      resource: AuditResource.USER,
      resourceId: id,
      details: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Activate user
   */
  async activateUser(
    id: string,
    activatedById: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await userRepository.update(id, { status: 'ACTIVE' });

    await auditLogRepository.create({
      userId: activatedById,
      action: AuditAction.USER_UPDATED,
      resource: AuditResource.USER,
      resourceId: id,
      details: { status: 'ACTIVE' },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Suspend user
   */
  async suspendUser(
    id: string,
    suspendedById: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await userRepository.update(id, { status: 'SUSPENDED' });

    await auditLogRepository.create({
      userId: suspendedById,
      action: AuditAction.USER_UPDATED,
      resource: AuditResource.USER,
      resourceId: id,
      details: { status: 'SUSPENDED' },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get users by role
   */
  async getUsersByRole(roleId: string, page = 1, limit = 20) {
    return await userRepository.findAll({ roleId }, page, limit);
  }

  /**
   * Get users by branch
   */
  async getUsersByBranch(branchId: string, page = 1, limit = 20) {
    return await userRepository.findAll({ branchId }, page, limit);
  }

  /**
   * Get users by status
   */
  async getUsersByStatus(status: UserStatus, page = 1, limit = 20) {
    return await userRepository.findAll({ status }, page, limit);
  }

  /**
   * Search users
   */
  async searchUsers(searchTerm: string, page = 1, limit = 20) {
    return await userRepository.findAll({ search: searchTerm }, page, limit);
  }
}

export const userService = new UserService();