import { prisma } from '@/lib/prisma';
import { CooperativeInitiative } from '@prisma/client';
import { CreateInitiativeInput, UpdateInitiativeInput, InitiativeFilters } from '@/types/cooperative.types';

export class CooperativeInitiativeRepository {
    async create(data: CreateInitiativeInput): Promise<CooperativeInitiative> {
        const { targetDate, ...rest } = data;
        return prisma.cooperativeInitiative.create({
            data: {
                ...rest,
                targetDate: targetDate ? new Date(targetDate) : null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
    }

    async update(id: string, data: UpdateInitiativeInput): Promise<CooperativeInitiative> {
        const { targetDate, ...rest } = data;

        const updateData: any = { ...rest, updatedAt: new Date() };
        if (targetDate) updateData.targetDate = new Date(targetDate);

        return prisma.cooperativeInitiative.update({
            where: { id },
            data: updateData
        });
    }

    async findAll(filters?: InitiativeFilters): Promise<CooperativeInitiative[]> {
        const where: any = {};

        if (filters?.status) where.status = filters.status;
        if (filters?.category) where.category = filters.category;

        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        return prisma.cooperativeInitiative.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                Member: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        photoUrl: true
                    }
                },
                _count: {
                    select: { Tasks: true }
                }
            }
        });
    }

    async findById(id: string): Promise<CooperativeInitiative | null> {
        return prisma.cooperativeInitiative.findUnique({
            where: { id },
            include: {
                Member: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        photoUrl: true
                    }
                },
                Tasks: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        Assignments: {
                            include: {
                                Member: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        photoUrl: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    async delete(id: string): Promise<CooperativeInitiative> {
        return prisma.cooperativeInitiative.delete({
            where: { id }
        });
    }

    async getStats() {
        // Group by status
        const statusGroups = await prisma.cooperativeInitiative.groupBy({
            by: ['status'],
            _count: { _all: true }
        });

        // Group by category
        const categoryGroups = await prisma.cooperativeInitiative.groupBy({
            by: ['category'],
            _count: { _all: true }
        });

        return {
            status: statusGroups.map(g => ({ status: g.status, count: g._count._all })),
            category: categoryGroups.map(g => ({ category: g.category, count: g._count._all }))
        };
    }
}

export const cooperativeInitiativeRepository = new CooperativeInitiativeRepository();
