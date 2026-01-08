import { prisma } from '@/lib/prisma';
import { CooperativeMember } from '@prisma/client';
import {
    CreateMemberInput,
    UpdateMemberInput,
    MemberFilters,
    MemberWithRelations
} from '@/types/cooperative-member.types';
import { randomUUID } from 'crypto';

export class CooperativeMemberRepository {
    async findAll(filters?: MemberFilters, pagination?: { skip?: number; limit?: number }): Promise<MemberWithRelations[]> {
        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.membershipTypeId) {
            where.membershipTypeId = filters.membershipTypeId;
        }

        if (filters?.search) {
            const searchTerms = filters.search.trim().split(/\s+/).filter(term => term.length > 0);
            if (searchTerms.length > 0) {
                where.AND = searchTerms.map(term => ({
                    OR: [
                        { memberCode: { contains: term, mode: 'insensitive' } },
                        { firstName: { contains: term, mode: 'insensitive' } },
                        { lastName: { contains: term, mode: 'insensitive' } },
                        { email: { contains: term, mode: 'insensitive' } },
                        { phone: { contains: term, mode: 'insensitive' } },
                    ],
                }));
            }
        }

        const rows = await prisma.cooperativeMember.findMany({
            where,
            include: {
                MembershipType: true,
                _count: {
                    select: {
                        Contributions: true,
                        Beneficiaries: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: pagination?.skip,
            take: pagination?.limit,
        });

        return rows.map((m: any) => ({
            ...m,
            _count: m._count
                ? { contributions: m._count.Contributions || 0, beneficiaries: m._count.Beneficiaries || 0 }
                : undefined,
        }));
    }

    async count(filters?: MemberFilters): Promise<number> {
        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.membershipTypeId) {
            where.membershipTypeId = filters.membershipTypeId;
        }

        if (filters?.search) {
            const searchTerms = filters.search.trim().split(/\s+/).filter(term => term.length > 0);
            if (searchTerms.length > 0) {
                where.AND = searchTerms.map(term => ({
                    OR: [
                        { memberCode: { contains: term, mode: 'insensitive' } },
                        { firstName: { contains: term, mode: 'insensitive' } },
                        { lastName: { contains: term, mode: 'insensitive' } },
                        { email: { contains: term, mode: 'insensitive' } },
                        { phone: { contains: term, mode: 'insensitive' } },
                    ],
                }));
            }
        }

        return await prisma.cooperativeMember.count({ where });
    }

    async findById(id: string): Promise<MemberWithRelations | null> {
        const row = await prisma.cooperativeMember.findUnique({
            where: { id },
            include: {
                MembershipType: true,
                _count: {
                    select: {
                        Contributions: true,
                        Beneficiaries: true,
                    },
                },
            },
        });

        if (!row) return null;

        return {
            ...row,
            _count: row._count
                ? { contributions: (row as any)._count.Contributions || 0, beneficiaries: (row as any)._count.Beneficiaries || 0 }
                : undefined,
        } as any;
    }

    async findByMemberCode(memberCode: string): Promise<CooperativeMember | null> {
        return await prisma.cooperativeMember.findUnique({
            where: { memberCode },
        });
    }

    async findByEmail(email: string): Promise<CooperativeMember | null> {
        return await prisma.cooperativeMember.findFirst({
            where: {
                email: {
                    equals: email,
                }
            },
        });
    }

    async findActive(): Promise<CooperativeMember[]> {
        return await prisma.cooperativeMember.findMany({
            where: { status: 'active' },
            orderBy: { lastName: 'asc' },
        });
    }

    async search(searchTerm: string): Promise<CooperativeMember[]> {
        const searchTerms = searchTerm.trim().split(/\s+/).filter(term => term.length > 0);
        const where: any = {};

        if (searchTerms.length > 0) {
            where.AND = searchTerms.map(term => ({
                OR: [
                    { memberCode: { contains: term, mode: 'insensitive' } },
                    { firstName: { contains: term, mode: 'insensitive' } },
                    { lastName: { contains: term, mode: 'insensitive' } },
                    { email: { contains: term, mode: 'insensitive' } },
                    { phone: { contains: term, mode: 'insensitive' } },
                ],
            }));
        }

        return await prisma.cooperativeMember.findMany({
            where,
            orderBy: { lastName: 'asc' },
        });
    }

    async create(data: CreateMemberInput & { createdById?: string }): Promise<CooperativeMember> {
        const memberCode = data.memberCode || await this.getNextMemberCode();
        const { createdById, ...memberData } = data;

        return await prisma.cooperativeMember.create({
            data: {
                id: randomUUID(),
                ...memberData,
                memberCode,
                createdById,
                dateOfBirth: new Date(memberData.dateOfBirth),
                membershipDate: memberData.membershipDate ? new Date(memberData.membershipDate) : new Date(),
                status: data.status || 'active',
                updatedAt: new Date(),
            },
        });
    }

    async update(id: string, data: UpdateMemberInput & { updatedById?: string }): Promise<CooperativeMember> {
        const updateData: any = {
            ...data,
            updatedAt: new Date(),
        };

        if (data.dateOfBirth) {
            updateData.dateOfBirth = new Date(data.dateOfBirth);
        }

        return await prisma.cooperativeMember.update({
            where: { id },
            data: updateData,
        });
    }

    async softDelete(id: string): Promise<CooperativeMember> {
        return await prisma.cooperativeMember.update({
            where: { id },
            data: { status: 'inactive' },
        });
    }

    async delete(id: string): Promise<CooperativeMember> {
        return await prisma.cooperativeMember.delete({
            where: { id },
        });
    }

    async updateStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<CooperativeMember> {
        return await prisma.cooperativeMember.update({
            where: { id },
            data: { status },
        });
    }

    async getNextMemberCode(): Promise<string> {
        const lastMember = await prisma.cooperativeMember.findFirst({
            where: {
                memberCode: {
                    startsWith: 'MEM-',
                },
            },
            orderBy: {
                memberCode: 'desc',
            },
        });

        if (!lastMember) {
            return 'MEM-00001';
        }

        const lastNumber = parseInt(lastMember.memberCode.split('-')[1]);
        const nextNumber = lastNumber + 1;
        return `MEM-${nextNumber.toString().padStart(5, '0')}`;
    }

    async getMemberStats(memberId: string) {
        const [contributions, beneficiaries, member] = await Promise.all([
            prisma.memberContribution.findMany({
                where: { memberId },
                select: {
                    contributionType: true,
                    amount: true,
                    contributionDate: true,
                },
            }),
            prisma.memberBeneficiary.count({
                where: { memberId },
            }),
            prisma.cooperativeMember.findUnique({
                where: { id: memberId },
                select: {
                    membershipDate: true,
                },
            }),
        ]);

        const totalContributions = contributions.reduce(
            (sum, c) => sum + Number(c.amount),
            0
        );

        const shareCapitalTotal = contributions
            .filter(c => c.contributionType === 'share_capital')
            .reduce((sum, c) => sum + Number(c.amount), 0);

        const savingsTotal = contributions
            .filter(c => c.contributionType === 'savings')
            .reduce((sum, c) => sum + Number(c.amount), 0);

        const membershipFeesTotal = contributions
            .filter(c => c.contributionType === 'membership_fee')
            .reduce((sum, c) => sum + Number(c.amount), 0);

        const lastContribution = contributions.length > 0
            ? contributions.sort((a, b) => b.contributionDate.getTime() - a.contributionDate.getTime())[0]
            : null;

        return {
            totalContributions,
            shareCapitalTotal,
            savingsTotal,
            membershipFeesTotal,
            beneficiariesCount: beneficiaries,
            memberSince: member?.membershipDate || new Date(),
            lastContributionDate: lastContribution?.contributionDate,
        };
    }
}

export const cooperativeMemberRepository = new CooperativeMemberRepository();
