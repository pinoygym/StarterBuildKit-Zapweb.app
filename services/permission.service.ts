// @ts-nocheck
import { permissionRepository } from '@/repositories/permission.repository';
import { PermissionResource } from '@prisma/client';

export class PermissionService {
  /**
   * Get all permissions
   */
  async getAllPermissions() {
    return await permissionRepository.findAll();
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(id: string) {
    return await permissionRepository.findById(id);
  }

  /**
   * Get permissions by resource
   */
  async getPermissionsByResource(resource: PermissionResource) {
    return await permissionRepository.findByResource(resource);
  }

  /**
   * Get permissions grouped by resource
   */
  async getPermissionsGrouped() {
    return await permissionRepository.findGroupedByResource();
  }

  /**
   * Check if user has specific permission
   */
  async userHasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const permissions = await permissionRepository.findByUserId(userId);
    return permissions.some(p => p.resource === resource && p.action === action);
  }

  /**
   * Get user permissions by userId
   * This retrieves all permissions assigned to the user's role
   */
  async getUserPermissions(userId: string) {
    return await permissionRepository.findByUserId(userId);
  }
}

export const permissionService = new PermissionService();
