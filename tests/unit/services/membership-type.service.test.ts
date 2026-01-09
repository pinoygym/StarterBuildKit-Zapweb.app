import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MembershipTypeService } from '@/services/membership-type.service';
import { membershipTypeRepository } from '@/repositories/membership-type.repository';
import { auditService } from '@/services/audit.service';
import { ValidationError, NotFoundError } from '@/lib/errors';

// Mock dependencies
vi.mock('@/repositories/membership-type.repository', () => ({
    membershipTypeRepository: {
        findAll: vi.fn(),
        findActive: vi.fn(),
        findById: vi.fn(),
        findByName: vi.fn(),
        findByCode: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        countMembers: vi.fn(),
    }
}));

vi.mock('@/services/audit.service', () => ({
    auditService: {
        log: vi.fn(),
    }
}));

describe('MembershipTypeService', () => {
    let service: MembershipTypeService;

    beforeEach(() => {
        service = new MembershipTypeService();
        vi.clearAllMocks();
    });

    describe('getAllTypes', () => {
        it('should return all membership types', async () => {
            const mockTypes = [
                { id: '1', name: 'Regular', code: 'REG', isSystemDefined: false },
                { id: '2', name: 'Premium', code: 'PREM', isSystemDefined: false },
            ];
            vi.mocked(membershipTypeRepository.findAll).mockResolvedValue(mockTypes as any);

            const result = await service.getAllTypes();

            expect(result).toEqual(mockTypes);
            expect(membershipTypeRepository.findAll).toHaveBeenCalled();
        });
    });

    describe('getActiveTypes', () => {
        it('should return active membership types', async () => {
            const mockTypes = [
                { id: '1', name: 'Regular', code: 'REG', status: 'active' },
            ];
            vi.mocked(membershipTypeRepository.findActive).mockResolvedValue(mockTypes as any);

            const result = await service.getActiveTypes();

            expect(result).toEqual(mockTypes);
            expect(membershipTypeRepository.findActive).toHaveBeenCalled();
        });
    });

    describe('getTypeById', () => {
        it('should return membership type by id', async () => {
            const mockType = { id: '1', name: 'Regular', code: 'REG' };
            vi.mocked(membershipTypeRepository.findById).mockResolvedValue(mockType as any);

            const result = await service.getTypeById('1');

            expect(result).toEqual(mockType);
            expect(membershipTypeRepository.findById).toHaveBeenCalledWith('1');
        });

        it('should throw NotFoundError if type not found', async () => {
            vi.mocked(membershipTypeRepository.findById).mockResolvedValue(null);

            await expect(service.getTypeById('999')).rejects.toThrow(NotFoundError);
        });
    });

    describe('createType', () => {
        it('should create a new membership type successfully', async () => {
            const typeData = {
                name: 'Regular',
                code: 'REG',
                description: 'Regular membership',
                monthlyFee: 100,
            };

            const mockType = {
                id: '1',
                ...typeData,
                isSystemDefined: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(membershipTypeRepository.findByName).mockResolvedValue(null);
            vi.mocked(membershipTypeRepository.findByCode).mockResolvedValue(null);
            vi.mocked(membershipTypeRepository.create).mockResolvedValue(mockType as any);

            const result = await service.createType(typeData, 'user-1');

            expect(result).toEqual(mockType);
            expect(membershipTypeRepository.create).toHaveBeenCalled();
            expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'CREATE',
                resource: 'MEMBERSHIP_TYPE',
            }));
        });

        it('should throw ValidationError if name already exists', async () => {
            const typeData = {
                name: 'Regular',
                code: 'REG',
                description: 'Regular membership',
                monthlyFee: 100,
            };

            vi.mocked(membershipTypeRepository.findByName).mockResolvedValue({ id: '2' } as any);

            await expect(service.createType(typeData)).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if code already exists', async () => {
            const typeData = {
                name: 'Regular',
                code: 'REG',
                description: 'Regular membership',
                monthlyFee: 100,
            };

            vi.mocked(membershipTypeRepository.findByName).mockResolvedValue(null);
            vi.mocked(membershipTypeRepository.findByCode).mockResolvedValue({ id: '2' } as any);

            await expect(service.createType(typeData)).rejects.toThrow(ValidationError);
        });
    });

    describe('updateType', () => {
        it('should update membership type successfully', async () => {
            const existingType = {
                id: '1',
                name: 'Regular',
                code: 'REG',
                isSystemDefined: false,
            };

            const updateData = {
                name: 'Premium',
            };

            const updatedType = { ...existingType, ...updateData };

            vi.mocked(membershipTypeRepository.findById).mockResolvedValue(existingType as any);
            vi.mocked(membershipTypeRepository.findByName).mockResolvedValue(null);
            vi.mocked(membershipTypeRepository.update).mockResolvedValue(updatedType as any);

            const result = await service.updateType('1', updateData, 'user-1');

            expect(result).toEqual(updatedType);
            expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'UPDATE',
                resource: 'MEMBERSHIP_TYPE',
            }));
        });

        it('should throw NotFoundError if type not found', async () => {
            vi.mocked(membershipTypeRepository.findById).mockResolvedValue(null);

            await expect(service.updateType('999', { name: 'Premium' })).rejects.toThrow(NotFoundError);
        });

        it('should throw ValidationError if trying to update system-defined type', async () => {
            const existingType = {
                id: '1',
                name: 'Regular',
                code: 'REG',
                isSystemDefined: true,
            };

            vi.mocked(membershipTypeRepository.findById).mockResolvedValue(existingType as any);

            await expect(service.updateType('1', { name: 'Premium' })).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if new name already exists', async () => {
            const existingType = {
                id: '1',
                name: 'Regular',
                code: 'REG',
                isSystemDefined: false,
            };

            vi.mocked(membershipTypeRepository.findById).mockResolvedValue(existingType as any);
            vi.mocked(membershipTypeRepository.findByName).mockResolvedValue({ id: '2' } as any);

            await expect(service.updateType('1', { name: 'Premium' })).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if new code already exists', async () => {
            const existingType = {
                id: '1',
                name: 'Regular',
                code: 'REG',
                isSystemDefined: false,
            };

            vi.mocked(membershipTypeRepository.findById).mockResolvedValue(existingType as any);
            vi.mocked(membershipTypeRepository.findByName).mockResolvedValue(null);
            vi.mocked(membershipTypeRepository.findByCode).mockResolvedValue({ id: '2' } as any);

            await expect(service.updateType('1', { code: 'PREM' })).rejects.toThrow(ValidationError);
        });
    });

    describe('deleteType', () => {
        it('should delete membership type successfully', async () => {
            const mockType = {
                id: '1',
                name: 'Regular',
                code: 'REG',
                isSystemDefined: false,
            };

            vi.mocked(membershipTypeRepository.findById).mockResolvedValue(mockType as any);
            vi.mocked(membershipTypeRepository.countMembers).mockResolvedValue(0);
            vi.mocked(membershipTypeRepository.delete).mockResolvedValue(undefined);

            await service.deleteType('1', 'user-1');

            expect(membershipTypeRepository.delete).toHaveBeenCalledWith('1');
            expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'DELETE',
                resource: 'MEMBERSHIP_TYPE',
            }));
        });

        it('should throw NotFoundError if type not found', async () => {
            vi.mocked(membershipTypeRepository.findById).mockResolvedValue(null);

            await expect(service.deleteType('999')).rejects.toThrow(NotFoundError);
        });

        it('should throw ValidationError if trying to delete system-defined type', async () => {
            const mockType = {
                id: '1',
                name: 'Regular',
                code: 'REG',
                isSystemDefined: true,
            };

            vi.mocked(membershipTypeRepository.findById).mockResolvedValue(mockType as any);

            await expect(service.deleteType('1')).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if type has existing members', async () => {
            const mockType = {
                id: '1',
                name: 'Regular',
                code: 'REG',
                isSystemDefined: false,
            };

            vi.mocked(membershipTypeRepository.findById).mockResolvedValue(mockType as any);
            vi.mocked(membershipTypeRepository.countMembers).mockResolvedValue(5);

            await expect(service.deleteType('1')).rejects.toThrow(ValidationError);
        });
    });
});
