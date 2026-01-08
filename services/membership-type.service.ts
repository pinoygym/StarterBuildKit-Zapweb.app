import { MembershipType } from '@prisma/client';
import { membershipTypeRepository } from '@/repositories/membership-type.repository';
import {
    CreateMembershipTypeInput,
    UpdateMembershipTypeInput
} from '@/types/cooperative-member.types';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { membershipTypeSchema, updateMembershipTypeSchema } from '@/lib/validations/cooperative-member.validation';
import { auditService } from './audit.service';

export class MembershipTypeService {
    async getAllTypes(): Promise<MembershipType[]> {
        return await membershipTypeRepository.findAll();
    }

    async getActiveTypes(): Promise<MembershipType[]> {
        return await membershipTypeRepository.findActive();
    }

    async getTypeById(id: string): Promise<MembershipType> {
        const type = await membershipTypeRepository.findById(id);
        if (!type) {
            throw new NotFoundError('Membership Type');
        }
        return type;
    }

    async createType(data: CreateMembershipTypeInput, userId?: string): Promise<MembershipType> {
        // Validate input
        const validationResult = membershipTypeSchema.safeParse(data);
        if (!validationResult.success) {
            const errors = validationResult.error.flatten().fieldErrors;
            throw new ValidationError('Invalid membership type data', errors as Record<string, string>);
        }

        // Check if name already exists
        const existingName = await membershipTypeRepository.findByName(data.name);
        if (existingName) {
            throw new ValidationError('Membership type name already exists', {
                name: 'Name must be unique'
            });
        }

        // Check if code already exists
        const existingCode = await membershipTypeRepository.findByCode(data.code);
        if (existingCode) {
            throw new ValidationError('Membership type code already exists', {
                code: 'Code must be unique'
            });
        }

        const type = await membershipTypeRepository.create(validationResult.data);

        // Log action
        await auditService.log({
            userId,
            action: 'CREATE',
            resource: 'MEMBERSHIP_TYPE',
            resourceId: type.id,
            details: { name: type.name, code: type.code }
        });

        return type;
    }

    async updateType(id: string, data: UpdateMembershipTypeInput, userId?: string): Promise<MembershipType> {
        // Check if type exists
        const existingType = await membershipTypeRepository.findById(id);
        if (!existingType) {
            throw new NotFoundError('Membership Type');
        }

        // Check if it's a system-defined type
        if (existingType.isSystemDefined) {
            throw new ValidationError('Cannot modify system-defined membership type', {
                type: 'System-defined types cannot be modified'
            });
        }

        // Validate input
        const validationResult = updateMembershipTypeSchema.safeParse(data);
        if (!validationResult.success) {
            const errors = validationResult.error.flatten().fieldErrors;
            throw new ValidationError('Invalid membership type data', errors as Record<string, string>);
        }

        // Check if name is being updated and if it already exists
        if (data.name && data.name !== existingType.name) {
            const typeWithName = await membershipTypeRepository.findByName(data.name);
            if (typeWithName) {
                throw new ValidationError('Membership type name already exists', {
                    name: 'Name must be unique'
                });
            }
        }

        // Check if code is being updated and if it already exists
        if (data.code && data.code !== existingType.code) {
            const typeWithCode = await membershipTypeRepository.findByCode(data.code);
            if (typeWithCode) {
                throw new ValidationError('Membership type code already exists', {
                    code: 'Code must be unique'
                });
            }
        }

        const type = await membershipTypeRepository.update(id, validationResult.data);

        // Log action
        await auditService.log({
            userId,
            action: 'UPDATE',
            resource: 'MEMBERSHIP_TYPE',
            resourceId: id,
            details: { changedFields: Object.keys(data) }
        });

        return type;
    }

    async deleteType(id: string, userId?: string): Promise<void> {
        // Check if type exists
        const type = await membershipTypeRepository.findById(id);
        if (!type) {
            throw new NotFoundError('Membership Type');
        }

        // Check if it's a system-defined type
        if (type.isSystemDefined) {
            throw new ValidationError('Cannot delete system-defined membership type', {
                type: 'System-defined types cannot be deleted'
            });
        }

        // Check if type has members
        const memberCount = await membershipTypeRepository.countMembers(id);
        if (memberCount > 0) {
            throw new ValidationError('Cannot delete membership type with existing members', {
                type: `This membership type has ${memberCount} member(s). Please reassign them first.`
            });
        }

        await membershipTypeRepository.delete(id);

        // Log action
        await auditService.log({
            userId,
            action: 'DELETE',
            resource: 'MEMBERSHIP_TYPE',
            resourceId: id,
            details: { name: type.name, code: type.code }
        });
    }
}

export const membershipTypeService = new MembershipTypeService();
