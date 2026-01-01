import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleService } from '@/services/role.service';
import { roleRepository } from '@/repositories/role.repository';
import { rolePermissionRepository } from '@/repositories/role-permission.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { sessionRepository } from '@/repositories/session.repository';

// Mock dependencies
vi.mock('@/repositories/role.repository', () => ({
  roleRepository: {
    findAll: vi.fn(),
    findAllWithPermissions: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUsersWithRole: vi.fn(),
  },
}));

vi.mock('@/repositories/role-permission.repository', () => ({
  rolePermissionRepository: {
    deleteByRoleId: vi.fn(),
    create: vi.fn(),
    findByRoleId: vi.fn(),
  },
}));

vi.mock('@/repositories/audit-log.repository', () => ({
  auditLogRepository: {
    create: vi.fn(),
  },
}));

vi.mock('@/repositories/session.repository', () => ({
  sessionRepository: {
    deleteByRoleId: vi.fn(),
  },
}));

describe('RoleService', () => {
  let roleService: RoleService;

  beforeEach(() => {
    roleService = new RoleService();
    vi.clearAllMocks();
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const mockRoles = [{ id: 'role-1', name: 'Admin' }];
      vi.mocked(roleRepository.findAll).mockResolvedValue(mockRoles as any);

      const result = await roleService.getAllRoles();

      expect(result).toEqual(mockRoles);
      expect(roleRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('createRole', () => {
    const createInput = {
      name: 'New Role',
      description: 'Role Description',
      isSystem: false,
    };
    const userId = 'user-123';

    it('should create a new role successfully', async () => {
      vi.mocked(roleRepository.findByName).mockResolvedValue(null);
      vi.mocked(roleRepository.create).mockResolvedValue({ id: 'role-1', ...createInput } as any);

      const result = await roleService.createRole(createInput, userId);

      expect(result).toEqual({ id: 'role-1', ...createInput });
      expect(roleRepository.create).toHaveBeenCalledWith(createInput);
      expect(auditLogRepository.create).toHaveBeenCalled();
    });

    it('should throw Error if role name already exists', async () => {
      vi.mocked(roleRepository.findByName).mockResolvedValue({ id: 'existing' } as any);

      await expect(roleService.createRole(createInput, userId)).rejects.toThrow('Role name already exists');
      expect(roleRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    const updateInput = {
      name: 'Updated Role',
    };
    const userId = 'user-123';
    const existingRole = { id: 'role-1', name: 'Role 1', isSystem: false };

    it('should update role successfully', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(existingRole as any);
      vi.mocked(roleRepository.findByName).mockResolvedValue(null);
      vi.mocked(roleRepository.update).mockResolvedValue({ ...existingRole, ...updateInput } as any);

      const result = await roleService.updateRole('role-1', updateInput, userId);

      expect(result).toEqual({ ...existingRole, ...updateInput });
      expect(roleRepository.update).toHaveBeenCalledWith('role-1', updateInput);
      expect(auditLogRepository.create).toHaveBeenCalled();
    });

    it('should throw Error if role not found', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null);

      await expect(roleService.updateRole('role-1', updateInput, userId)).rejects.toThrow('Role not found');
    });

    it('should throw Error if updating system role name', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue({ ...existingRole, isSystem: true } as any);

      await expect(roleService.updateRole('role-1', updateInput, userId)).rejects.toThrow('System role names cannot be changed');
    });

    it('should throw Error if new name already exists', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(existingRole as any);
      vi.mocked(roleRepository.findByName).mockResolvedValue({ id: 'other-role' } as any);

      await expect(roleService.updateRole('role-1', updateInput, userId)).rejects.toThrow('Role name already exists');
    });
  });

  describe('deleteRole', () => {
    const userId = 'user-123';

    it('should delete role successfully', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue({ id: 'role-1', isSystem: false } as any);
      vi.mocked(roleRepository.findUsersWithRole).mockResolvedValue([]);

      await roleService.deleteRole('role-1', userId);

      expect(roleRepository.delete).toHaveBeenCalledWith('role-1');
      expect(auditLogRepository.create).toHaveBeenCalled();
    });

    it('should throw Error if role not found', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null);

      await expect(roleService.deleteRole('role-1', userId)).rejects.toThrow('Role not found');
    });

    it('should throw Error if deleting system role', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue({ id: 'role-1', isSystem: true } as any);

      await expect(roleService.deleteRole('role-1', userId)).rejects.toThrow('System roles cannot be deleted');
    });

    it('should throw Error if role has assigned users', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue({ id: 'role-1', isSystem: false } as any);
      vi.mocked(roleRepository.findUsersWithRole).mockResolvedValue([{ id: 'user-1' }] as any);

      await expect(roleService.deleteRole('role-1', userId)).rejects.toThrow(/Cannot delete role/);
    });
  });

  describe('assignPermissions', () => {
    const userId = 'user-123';
    const permissionIds = ['perm-1', 'perm-2'];

    it('should assign permissions successfully', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue({ id: 'role-1', isSystem: false } as any);

      await roleService.assignPermissions('role-1', permissionIds, userId);

      expect(rolePermissionRepository.deleteByRoleId).toHaveBeenCalledWith('role-1');
      expect(rolePermissionRepository.create).toHaveBeenCalledTimes(2);
      expect(sessionRepository.deleteByRoleId).toHaveBeenCalledWith('role-1');
      expect(auditLogRepository.create).toHaveBeenCalled();
    });

    it('should throw Error if role not found', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null);

      await expect(roleService.assignPermissions('role-1', permissionIds, userId)).rejects.toThrow('Role not found');
    });

    it('should throw Error if updating system role permissions', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue({ id: 'role-1', isSystem: true } as any);

      await expect(roleService.assignPermissions('role-1', permissionIds, userId)).rejects.toThrow('System role permissions cannot be modified');
    });
  });
});
