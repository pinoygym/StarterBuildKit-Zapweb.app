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
                name: data.name,
                code: data.code,
                description: data.description,
                monthlyFee: (data as any).monthlyFee || (data as any).monthlyDues || 0,
                registrationFee: (data as any).registrationFee || 0,
                minimumShareCapital: (data as any).minimumShareCapital || (data as any).requiredShareCapital || 0,
                requirements: (data as any).requirements,
                benefits: (data as any).benefits,
                status: data.status || 'active',
                displayOrder: data.displayOrder || 0,
                updatedAt: new Date(),
            },
        });
    }

    async update(id: string, data: UpdateMembershipTypeInput): Promise<MembershipType> {
        const { monthlyFee, monthlyDues, registrationFee, minimumShareCapital, requiredShareCapital, ...rest } = data as any;

        return await prisma.membershipType.update({
            where: { id },
            data: {
                ...rest,
                monthlyFee: monthlyFee !== undefined ? Number(monthlyFee) : (monthlyDues !== undefined ? Number(monthlyDues) : undefined),
                registrationFee: registrationFee !== undefined ? Number(registrationFee) : undefined,
                minimumShareCapital: minimumShareCapital !== undefined ? Number(minimumShareCapital) : (requiredShareCapital !== undefined ? Number(requiredShareCapital) : undefined),
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
