// @ts-nocheck
import { roleRepository } from '@/repositories/role.repository';
import { rolePermissionRepository } from '@/repositories/role-permission.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { sessionRepository } from '@/repositories/session.repository';
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
   * Get all roles with permissions
   */
  async getAllRolesWithPermissions() {
    return await roleRepository.findAllWithPermissions();
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string) {
    return await roleRepository.findById(id);
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string) {
    return await roleRepository.findByName(name);
  }

  /**
   * Create new role
   */
  async createRole(
    data: { name: string; description?: string; isSystem?: boolean },
    createdById: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Check if name already exists
    const existing = await roleRepository.findByName(data.name);
    if (existing) {
      throw new Error('Role name already exists');
    }

    const createData: Prisma.RoleCreateInput = {
      name: data.name,
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
    data: { name?: string; description?: string },
    updatedById: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existingRole = await roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('Role not found');
    }

    // Prevent updating system roles' names
    if (existingRole.isSystem && data.name && data.name !== existingRole.name) {
      throw new Error('System role names cannot be changed');
    }

    // Check if name is being changed and if it's already taken
    if (data.name && data.name !== existingRole.name) {
      const nameExists = await roleRepository.findByName(data.name);
      if (nameExists) {
        throw new Error('Role name already exists');
      }
    }

    const updateData: Prisma.RoleUpdateInput = {
      ...(data.name && { name: data.name }),
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

    // Invalidate all sessions for users with this role
    // This forces users to re-authenticate and get updated permissions
    await sessionRepository.deleteByRoleId(roleId);

    // Log the action
    await auditLogRepository.create({
      userId: assignedById,
      action: AuditAction.ROLE_UPDATED,
      resource: AuditResource.ROLE,
      resourceId: roleId,
      details: {
        action: 'permissions_updated',
        permissionIds,
        sessionsInvalidated: true,
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
