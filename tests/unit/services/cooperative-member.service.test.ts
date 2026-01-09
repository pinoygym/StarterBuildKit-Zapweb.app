import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CooperativeMemberService } from '@/services/cooperative-member.service';
import { cooperativeMemberRepository } from '@/repositories/cooperative-member.repository';
import { auditService } from '@/services/audit.service';
import { ValidationError, NotFoundError } from '@/lib/errors';

// Mock dependencies
vi.mock('@/repositories/cooperative-member.repository', () => ({
    cooperativeMemberRepository: {
        findAll: vi.fn(),
        count: vi.fn(),
        findById: vi.fn(),
        findActive: vi.fn(),
        search: vi.fn(),
        findByEmail: vi.fn(),
        findByMemberCode: vi.fn(),
        getNextMemberCode: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
        updateStatus: vi.fn(),
        getMemberStats: vi.fn(),
    }
}));

vi.mock('@/services/audit.service', () => ({
    auditService: {
        log: vi.fn(),
    }
}));

describe('CooperativeMemberService', () => {
    let service: CooperativeMemberService;

    beforeEach(() => {
        service = new CooperativeMemberService();
        vi.clearAllMocks();
    });

    describe('getAllMembers', () => {
        it('should return all members with filters and pagination', async () => {
            const mockMembers = [
                { id: '1', firstName: 'John', lastName: 'Doe', memberCode: 'M001' },
                { id: '2', firstName: 'Jane', lastName: 'Smith', memberCode: 'M002' },
            ];
            vi.mocked(cooperativeMemberRepository.findAll).mockResolvedValue(mockMembers as any);

            const filters = { status: 'active' as const };
            const pagination = { skip: 0, limit: 10 };
            const result = await service.getAllMembers(filters, pagination);

            expect(result).toEqual(mockMembers);
            expect(cooperativeMemberRepository.findAll).toHaveBeenCalledWith(filters, pagination);
        });
    });

    describe('getMemberCount', () => {
        it('should return member count', async () => {
            vi.mocked(cooperativeMemberRepository.count).mockResolvedValue(5);

            const result = await service.getMemberCount({ status: 'active' });

            expect(result).toBe(5);
            expect(cooperativeMemberRepository.count).toHaveBeenCalledWith({ status: 'active' });
        });
    });

    describe('getMemberById', () => {
        it('should return member by id', async () => {
            const mockMember = { id: '1', firstName: 'John', lastName: 'Doe', memberCode: 'M001' };
            vi.mocked(cooperativeMemberRepository.findById).mockResolvedValue(mockMember as any);

            const result = await service.getMemberById('1');

            expect(result).toEqual(mockMember);
            expect(cooperativeMemberRepository.findById).toHaveBeenCalledWith('1');
        });

        it('should throw NotFoundError if member not found', async () => {
            vi.mocked(cooperativeMemberRepository.findById).mockResolvedValue(null);

            await expect(service.getMemberById('999')).rejects.toThrow(NotFoundError);
        });
    });

    describe('getActiveMembers', () => {
        it('should return active members', async () => {
            const mockMembers = [
                { id: '1', firstName: 'John', lastName: 'Doe', memberCode: 'M001', status: 'active' },
            ];
            vi.mocked(cooperativeMemberRepository.findActive).mockResolvedValue(mockMembers as any);

            const result = await service.getActiveMembers();

            expect(result).toEqual(mockMembers);
            expect(cooperativeMemberRepository.findActive).toHaveBeenCalled();
        });
    });

    describe('searchMembers', () => {
        it('should search members by term', async () => {
            const mockMembers = [
                { id: '1', firstName: 'John', lastName: 'Doe', memberCode: 'M001' },
            ];
            vi.mocked(cooperativeMemberRepository.search).mockResolvedValue(mockMembers as any);

            const result = await service.searchMembers('John');

            expect(result).toEqual(mockMembers);
            expect(cooperativeMemberRepository.search).toHaveBeenCalledWith('John');
        });

        it('should return all members if search term is empty', async () => {
            const mockMembers = [
                { id: '1', firstName: 'John', lastName: 'Doe', memberCode: 'M001' },
            ];
            vi.mocked(cooperativeMemberRepository.findAll).mockResolvedValue(mockMembers as any);

            const result = await service.searchMembers('  ');

            expect(result).toEqual(mockMembers);
            expect(cooperativeMemberRepository.findAll).toHaveBeenCalled();
        });
    });

    describe('createMember', () => {
        it('should create a new member successfully', async () => {
            const memberData = {
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'male' as const,
                civilStatus: 'single' as const,
                email: 'john@example.com',
                phone: '1234567890',
                membershipTypeId: 'type-1',
                address: '123 Main St',
            };

            const mockMember = {
                id: '1',
                ...memberData,
                memberCode: 'M001',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(cooperativeMemberRepository.findByEmail).mockResolvedValue(null);
            vi.mocked(cooperativeMemberRepository.getNextMemberCode).mockResolvedValue('M001');
            vi.mocked(cooperativeMemberRepository.create).mockResolvedValue(mockMember as any);

            const result = await service.createMember(memberData, 'user-1');

            expect(result).toEqual(mockMember);
            expect(cooperativeMemberRepository.create).toHaveBeenCalled();
            expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'CREATE',
                resource: 'COOPERATIVE_MEMBER',
            }));
        });

        it('should throw ValidationError if email already exists', async () => {
            const memberData = {
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'male' as const,
                civilStatus: 'single' as const,
                email: 'john@example.com',
                phone: '1234567890',
                membershipTypeId: 'type-1',
                address: '123 Main St',
            };

            vi.mocked(cooperativeMemberRepository.findByEmail).mockResolvedValue({ id: '2' } as any);

            await expect(service.createMember(memberData)).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if member code already exists', async () => {
            const memberData = {
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'male' as const,
                civilStatus: 'single' as const,
                email: 'john@example.com',
                phone: '1234567890',
                membershipTypeId: 'type-1',
                address: '123 Main St',
                memberCode: 'M001',
            };

            vi.mocked(cooperativeMemberRepository.findByEmail).mockResolvedValue(null);
            vi.mocked(cooperativeMemberRepository.findByMemberCode).mockResolvedValue({ id: '2' } as any);

            await expect(service.createMember(memberData)).rejects.toThrow(ValidationError);
        });
    });

    describe('updateMember', () => {
        it('should update member successfully', async () => {
            const existingMember = {
                id: '1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                memberCode: 'M001',
            };

            const updateData = {
                firstName: 'Jane',
            };

            const updatedMember = { ...existingMember, ...updateData };

            vi.mocked(cooperativeMemberRepository.findById).mockResolvedValue(existingMember as any);
            vi.mocked(cooperativeMemberRepository.update).mockResolvedValue(updatedMember as any);

            const result = await service.updateMember('1', updateData, 'user-1');

            expect(result).toEqual(updatedMember);
            expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'UPDATE',
                resource: 'COOPERATIVE_MEMBER',
            }));
        });

        it('should throw NotFoundError if member not found', async () => {
            vi.mocked(cooperativeMemberRepository.findById).mockResolvedValue(null);

            await expect(service.updateMember('999', { firstName: 'Jane' })).rejects.toThrow(NotFoundError);
        });

        it('should throw ValidationError if new email already exists', async () => {
            const existingMember = {
                id: '1',
                email: 'john@example.com',
            };

            vi.mocked(cooperativeMemberRepository.findById).mockResolvedValue(existingMember as any);
            vi.mocked(cooperativeMemberRepository.findByEmail).mockResolvedValue({ id: '2' } as any);

            await expect(service.updateMember('1', { email: 'jane@example.com' })).rejects.toThrow(ValidationError);
        });
    });

    describe('deleteMember', () => {
        it('should soft delete member successfully', async () => {
            const mockMember = {
                id: '1',
                firstName: 'John',
                lastName: 'Doe',
                memberCode: 'M001',
                _count: { contributions: 0 },
            };

            vi.mocked(cooperativeMemberRepository.findById).mockResolvedValue(mockMember as any);
            vi.mocked(cooperativeMemberRepository.softDelete).mockResolvedValue(mockMember as any);

            await service.deleteMember('1', 'user-1');

            expect(cooperativeMemberRepository.softDelete).toHaveBeenCalledWith('1');
            expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'DELETE',
                resource: 'COOPERATIVE_MEMBER',
            }));
        });

        it('should throw NotFoundError if member not found', async () => {
            vi.mocked(cooperativeMemberRepository.findById).mockResolvedValue(null);

            await expect(service.deleteMember('999')).rejects.toThrow(NotFoundError);
        });

        it('should throw ValidationError if member has contributions', async () => {
            const mockMember = {
                id: '1',
                _count: { contributions: 5 },
            };

            vi.mocked(cooperativeMemberRepository.findById).mockResolvedValue(mockMember as any);

            await expect(service.deleteMember('1')).rejects.toThrow(ValidationError);
        });
    });

    describe('toggleMemberStatus', () => {
        it('should toggle member status from active to inactive', async () => {
            const mockMember = {
                id: '1',
                status: 'active',
            };

            const updatedMember = {
                ...mockMember,
                status: 'inactive',
            };

            vi.mocked(cooperativeMemberRepository.findById).mockResolvedValue(mockMember as any);
            vi.mocked(cooperativeMemberRepository.updateStatus).mockResolvedValue(updatedMember as any);

            const result = await service.toggleMemberStatus('1');

            expect(result.status).toBe('inactive');
            expect(cooperativeMemberRepository.updateStatus).toHaveBeenCalledWith('1', 'inactive');
        });
    });

    describe('getMemberStats', () => {
        it('should return member statistics', async () => {
            const mockMember = { id: '1', firstName: 'John' };
            const mockStats = {
                totalContributions: 10000,
                contributionCount: 5,
                lastContributionDate: new Date(),
            };

            vi.mocked(cooperativeMemberRepository.findById).mockResolvedValue(mockMember as any);
            vi.mocked(cooperativeMemberRepository.getMemberStats).mockResolvedValue(mockStats as any);

            const result = await service.getMemberStats('1');

            expect(result).toEqual(mockStats);
            expect(cooperativeMemberRepository.getMemberStats).toHaveBeenCalledWith('1');
        });
    });

    describe('validateMemberActive', () => {
        it('should not throw error for active member', async () => {
            const mockMember = {
                id: '1',
                status: 'active',
            };

            vi.mocked(cooperativeMemberRepository.findById).mockResolvedValue(mockMember as any);

            await expect(service.validateMemberActive('1')).resolves.not.toThrow();
        });

        it('should throw ValidationError for inactive member', async () => {
            const mockMember = {
                id: '1',
                status: 'inactive',
            };

            vi.mocked(cooperativeMemberRepository.findById).mockResolvedValue(mockMember as any);

            await expect(service.validateMemberActive('1')).rejects.toThrow(ValidationError);
        });
    });
});
