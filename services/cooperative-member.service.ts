import { CooperativeMember } from '@prisma/client';
import { cooperativeMemberRepository } from '@/repositories/cooperative-member.repository';
import {
    CreateMemberInput,
    UpdateMemberInput,
    MemberFilters,
    MemberWithRelations,
    MemberStats
} from '@/types/cooperative-member.types';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { memberSchema, updateMemberSchema } from '@/lib/validations/cooperative-member.validation';
import { auditService } from './audit.service';

export class CooperativeMemberService {
    async getAllMembers(filters?: MemberFilters, pagination?: { skip?: number; limit?: number }): Promise<MemberWithRelations[]> {
        return await cooperativeMemberRepository.findAll(filters, pagination);
    }

    async getMemberCount(filters?: MemberFilters): Promise<number> {
        return await cooperativeMemberRepository.count(filters);
    }

    async getMemberById(id: string): Promise<MemberWithRelations> {
        const member = await cooperativeMemberRepository.findById(id);
        if (!member) {
            throw new NotFoundError('Cooperative Member');
        }
        return member;
    }

    async getActiveMembers(): Promise<CooperativeMember[]> {
        return await cooperativeMemberRepository.findActive();
    }

    async searchMembers(searchTerm: string): Promise<CooperativeMember[]> {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return await cooperativeMemberRepository.findAll();
        }
        return await cooperativeMemberRepository.search(searchTerm.trim());
    }

    async createMember(data: CreateMemberInput, userId?: string): Promise<CooperativeMember> {
        // Validate input
        const validationResult = memberSchema.safeParse(data);
        if (!validationResult.success) {
            const errors = validationResult.error.flatten().fieldErrors;
            throw new ValidationError('Invalid member data', errors as Record<string, string>);
        }

        // Check if email already exists (only if email is provided)
        if (data.email) {
            const existingMember = await cooperativeMemberRepository.findByEmail(data.email);
            if (existingMember) {
                throw new ValidationError('Member email already exists', {
                    email: 'Email must be unique'
                });
            }
        }

        // Generate member code if not provided
        let memberCode = data.memberCode;
        if (!memberCode) {
            memberCode = await cooperativeMemberRepository.getNextMemberCode();
        } else {
            // Check if member code already exists
            const existingCode = await cooperativeMemberRepository.findByMemberCode(memberCode);
            if (existingCode) {
                throw new ValidationError('Member code already exists', {
                    memberCode: 'Member code must be unique'
                });
            }
        }

        const member = await cooperativeMemberRepository.create({
            ...validationResult.data,
            memberCode,
            createdById: userId,
        });

        // Log action
        await auditService.log({
            userId,
            action: 'CREATE',
            resource: 'COOPERATIVE_MEMBER',
            resourceId: member.id,
            details: {
                memberCode: member.memberCode,
                name: `${member.firstName} ${member.lastName}`
            }
        });

        return member;
    }

    async updateMember(id: string, data: UpdateMemberInput, userId?: string): Promise<CooperativeMember> {
        // Check if member exists
        const existingMember = await cooperativeMemberRepository.findById(id);
        if (!existingMember) {
            throw new NotFoundError('Cooperative Member');
        }

        // Validate input
        const validationResult = updateMemberSchema.safeParse(data);
        if (!validationResult.success) {
            const errors = validationResult.error.flatten().fieldErrors;
            throw new ValidationError('Invalid member data', errors as Record<string, string>);
        }

        // Check if email is being updated and if it already exists
        if (data.email && data.email !== existingMember.email) {
            const memberWithEmail = await cooperativeMemberRepository.findByEmail(data.email);
            if (memberWithEmail) {
                throw new ValidationError('Member email already exists', {
                    email: 'Email must be unique'
                });
            }
        }

        const member = await cooperativeMemberRepository.update(id, {
            ...validationResult.data,
            updatedById: userId
        });

        // Log action
        await auditService.log({
            userId,
            action: 'UPDATE',
            resource: 'COOPERATIVE_MEMBER',
            resourceId: id,
            details: { changedFields: Object.keys(data) }
        });

        return member;
    }

    async deleteMember(id: string, userId?: string): Promise<void> {
        // Check if member exists
        const member = await cooperativeMemberRepository.findById(id);
        if (!member) {
            throw new NotFoundError('Cooperative Member');
        }

        // Check if member has contributions
        if (member._count && (member._count.contributions || 0) > 0) {
            throw new ValidationError('Cannot delete member with existing contributions', {
                member: 'Please remove all contributions first'
            });
        }

        // Perform soft delete (set status to inactive)
        await cooperativeMemberRepository.softDelete(id);

        // Log action
        await auditService.log({
            userId,
            action: 'DELETE',
            resource: 'COOPERATIVE_MEMBER',
            resourceId: id,
            details: {
                memberCode: member.memberCode,
                name: `${member.firstName} ${member.lastName}`,
                status: 'inactive'
            }
        });
    }

    async toggleMemberStatus(id: string): Promise<CooperativeMember> {
        const member = await this.getMemberById(id);
        const newStatus = member.status === 'active' ? 'inactive' : 'active';
        return await cooperativeMemberRepository.updateStatus(id, newStatus as any);
    }

    async getMemberStats(id: string): Promise<MemberStats> {
        // Verify member exists
        await this.getMemberById(id);
        return await cooperativeMemberRepository.getMemberStats(id);
    }

    /**
     * Validate that a member is active before using in transactions
     */
    async validateMemberActive(id: string): Promise<void> {
        const member = await this.getMemberById(id);
        if (member.status !== 'active') {
            throw new ValidationError('Member is not active', {
                memberId: 'Only active members can be used in transactions'
            });
        }
    }
}

export const cooperativeMemberService = new CooperativeMemberService();
