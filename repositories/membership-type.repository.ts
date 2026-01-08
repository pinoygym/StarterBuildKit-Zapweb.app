import { prisma } from '@/lib/prisma';
import { MembershipType } from '@prisma/client';
import {
    CreateMembershipTypeInput,
    UpdateMembershipTypeInput
} from '@/types/cooperative-member.types';
import { randomUUID } from 'crypto';

export class MembershipTypeRepository {
    async findAll(): Promise<MembershipType[]> {
        return await prisma.membershipType.findMany({
            orderBy: { displayOrder: 'asc' },
        });
    }

    async findActive(): Promise<MembershipType[]> {
        return await prisma.membershipType.findMany({
            where: { status: 'active' },
            orderBy: { displayOrder: 'asc' },
        });
    }

    async findById(id: string): Promise<MembershipType | null> {
        return await prisma.membershipType.findUnique({
            where: { id },
        });
    }

    async findByCode(code: string): Promise<MembershipType | null> {
        return await prisma.membershipType.findUnique({
            where: { code },
        });
    }

    async findByName(name: string): Promise<MembershipType | null> {
        return await prisma.membershipType.findUnique({
            where: { name },
        });
    }

    async create(data: CreateMembershipTypeInput): Promise<MembershipType> {
        return await prisma.membershipType.create({
            data: {
                id: randomUUID(),
                ...data,
                requiredShareCapital: data.requiredShareCapital || 0,
                monthlyDues: data.monthlyDues || 0,
                status: data.status || 'active',
                displayOrder: data.displayOrder || 0,
                isSystemDefined: false,
                updatedAt: new Date(),
            },
        });
    }

    async update(id: string, data: UpdateMembershipTypeInput): Promise<MembershipType> {
        return await prisma.membershipType.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
    }

    async delete(id: string): Promise<MembershipType> {
        return await prisma.membershipType.delete({
            where: { id },
        });
    }

    async countMembers(membershipTypeId: string): Promise<number> {
        return await prisma.cooperativeMember.count({
            where: { membershipTypeId },
        });
    }
}

export const membershipTypeRepository = new MembershipTypeRepository();
