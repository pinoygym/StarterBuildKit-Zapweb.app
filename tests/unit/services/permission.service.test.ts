
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { permissionService } from '@/services/permission.service';
import { permissionRepository } from '@/repositories/permission.repository';

vi.mock('@/repositories/permission.repository', () => ({
    permissionRepository: {
        findAll: vi.fn(),
        findById: vi.fn(),
        findByResource: vi.fn(),
        findGroupedByResource: vi.fn(),
        findByUserId: vi.fn(),
    }
}));

describe('PermissionService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('userHasPermission', () => {
        it('should return true if user has permission', async () => {
            vi.mocked(permissionRepository.findByUserId).mockResolvedValue([
                { resource: 'products', action: 'create' }
            ] as any);

            const result = await permissionService.userHasPermission('u1', 'products', 'create');
            expect(result).toBe(true);
        });

        it('should return false if user lacks permission', async () => {
            vi.mocked(permissionRepository.findByUserId).mockResolvedValue([]);

            const result = await permissionService.userHasPermission('u1', 'products', 'delete');
            expect(result).toBe(false);
        });
    });
});
