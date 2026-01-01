import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermissionService } from '@/services/permission.service';
import { permissionRepository } from '@/repositories/permission.repository';
import { PermissionResource } from '@prisma/client';

// Mock dependencies
vi.mock('@/repositories/permission.repository', () => ({
  permissionRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByResource: vi.fn(),
    findGroupedByResource: vi.fn(),
    findByUserId: vi.fn(),
  },
}));

describe('PermissionService', () => {
  let permissionService: PermissionService;

  beforeEach(() => {
    permissionService = new PermissionService();
    vi.clearAllMocks();
  });

  describe('getAllPermissions', () => {
    it('should return all permissions', async () => {
      const mockPermissions = [{ id: 'perm-1', action: 'read' }];
      vi.mocked(permissionRepository.findAll).mockResolvedValue(mockPermissions as any);

      const result = await permissionService.getAllPermissions();

      expect(result).toEqual(mockPermissions);
      expect(permissionRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getPermissionById', () => {
    it('should return permission by id', async () => {
      const mockPermission = { id: 'perm-1', action: 'read' };
      vi.mocked(permissionRepository.findById).mockResolvedValue(mockPermission as any);

      const result = await permissionService.getPermissionById('perm-1');

      expect(result).toEqual(mockPermission);
      expect(permissionRepository.findById).toHaveBeenCalledWith('perm-1');
    });
  });

  describe('getPermissionsByResource', () => {
    it('should return permissions by resource', async () => {
      const mockPermissions = [{ id: 'perm-1', resource: 'users' }];
      vi.mocked(permissionRepository.findByResource).mockResolvedValue(mockPermissions as any);

      const resource = 'users' as PermissionResource;
      const result = await permissionService.getPermissionsByResource(resource);

      expect(result).toEqual(mockPermissions);
      expect(permissionRepository.findByResource).toHaveBeenCalledWith(resource);
    });
  });

  describe('getPermissionsGrouped', () => {
    it('should return permissions grouped by resource', async () => {
      const mockGrouped = { users: [{ id: 'perm-1' }] };
      vi.mocked(permissionRepository.findGroupedByResource).mockResolvedValue(mockGrouped as any);

      const result = await permissionService.getPermissionsGrouped();

      expect(result).toEqual(mockGrouped);
      expect(permissionRepository.findGroupedByResource).toHaveBeenCalled();
    });
  });

  describe('userHasPermission', () => {
    it('should return true if user has permission', async () => {
      const mockPermissions = [{ resource: 'users', action: 'read' }];
      vi.mocked(permissionRepository.findByUserId).mockResolvedValue(mockPermissions as any);

      const result = await permissionService.userHasPermission('user-1', 'users', 'read');

      expect(result).toBe(true);
    });

    it('should return false if user does not have permission', async () => {
      const mockPermissions = [{ resource: 'users', action: 'read' }];
      vi.mocked(permissionRepository.findByUserId).mockResolvedValue(mockPermissions as any);

      const result = await permissionService.userHasPermission('user-1', 'products', 'write');

      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const mockPermissions = [{ id: 'perm-1' }];
      vi.mocked(permissionRepository.findByUserId).mockResolvedValue(mockPermissions as any);

      const result = await permissionService.getUserPermissions('user-1');

      expect(result).toEqual(mockPermissions);
      expect(permissionRepository.findByUserId).toHaveBeenCalledWith('user-1');
    });
  });
});
