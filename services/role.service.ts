// @ts-nocheck
import { roleRepository } from '@/repositories/role.repository';
import { rolePermissionRepository } from '@/repositories/role-permission.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { AuditAction, AuditResource } from '@/types/audit.types';
import { Prisma } from '@prisma/client';

export class RoleService {
  /**
   * Get all roles
   */
  async getAllRoles() {
    return await roleRepository.findAll();
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string) {
    return await roleRepository.findById(id);
  }

  /**
   * Get role by code
   */
  async getRoleByCode(code: string) {
    return await roleRepository.findByCode(code);
  }

  /**
   * Create new role
   */
  async createRole(
    data: { name: string; code: string; description?: string; isSystem?: boolean },
    createdById: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Check if code already exists
    const existing = await roleRepository.findByCode(data.code);
    if (existing) {
      throw new Error('Role code already exists');
    }

    const createData: Prisma.RoleCreateInput = {
      name: data.name,
      code: data.code,
      description: data.description,
      isSystem: data.isSystem || false,
    };

    const role = await roleRepository.create(createData);

    // Log the action
    await auditLogRepository.create({
      userId: createdById,
      action: AuditAction.ROLE_CREATED,
      resource: AuditResource.ROLE,
      resourceId: role.id,
      details: {
        name: role.name,
        code: role.code,
      },
      ipAddress,
      userAgent,
    });

    return role;
  }

  /**
   * Update role
   */
  async updateRole(
    id: string,
    data: { name?: string; code?: string; description?: string },
    updatedById: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existingRole = await roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('Role not found');
    }

    // Prevent updating system roles
    if (existingRole.isSystem) {
      throw new Error('System roles cannot be updated');
    }

    // Check if code is being changed and if it's already taken
    if (data.code && data.code !== existingRole.code) {
      const codeExists = await roleRepository.findByCode(data.code);
      if (codeExists) {
        throw new Error('Role code already exists');
      }
    }

    const updateData: Prisma.RoleUpdateInput = {
      ...(data.name && { name: data.name }),
      ...(data.code && { code: data.code }),
      ...(data.description !== undefined && { description: data.description }),
    };

    const updatedRole = await roleRepository.update(id, updateData);

    // Log the action
    await auditLogRepository.create({
      userId: updatedById,
      action: AuditAction.ROLE_UPDATED,
      resource: AuditResource.ROLE,
      resourceId: id,
      details: {
        changes: data,
      },
      ipAddress,
      userAgent,
    });

    return updatedRole;
  }

  /**
   * Delete role
   */
  async deleteRole(
    id: string,
    deletedById: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new Error('Role not found');
    }

    // Prevent deleting system roles
    if (role.isSystem) {
      throw new Error('System roles cannot be deleted');
    }

    // Check if any users have this role
    const users = await roleRepository.findUsersWithRole(id);
    if (users.length > 0) {
      throw new Error(`Cannot delete role. ${users.length} user(s) have this role assigned.`);
    }

    await roleRepository.delete(id);

    // Log the action
    await auditLogRepository.create({
      userId: deletedById,
      action: AuditAction.ROLE_DELETED,
      resource: AuditResource.ROLE,
      resourceId: id,
      details: {
        name: role.name,
        code: role.code,
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Assign permissions to role
   */
  async assignPermissions(
    roleId: string,
    permissionIds: string[],
    assignedById: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Prevent modifying system role permissions
    if (role.isSystem) {
      throw new Error('System role permissions cannot be modified');
    }

    // Remove existing permissions
    await rolePermissionRepository.deleteByRoleId(roleId);

    // Add new permissions
    for (const permissionId of permissionIds) {
      await rolePermissionRepository.create({
        roleId,
        permissionId,
      });
    }

    // Log the action
    await auditLogRepository.create({
      userId: assignedById,
      action: AuditAction.ROLE_UPDATED,
      resource: AuditResource.ROLE,
      resourceId: roleId,
      details: {
        action: 'permissions_updated',
        permissionIds,
      },
      ipAddress,
      userAgent,
    });

    return await roleRepository.findById(roleId);
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: string) {
    return await rolePermissionRepository.findByRoleId(roleId);
  }

  /**
   * Get users with specific role
   */
  async getUsersWithRole(roleId: string) {
    return await roleRepository.findUsersWithRole(roleId);
  }
}

export const roleService = new RoleService();
