import { prisma } from '@/lib/prisma';
import { CooperativeFarm } from '@prisma/client';
import { CreateFarmInput } from '@/types/cooperative.types';

export class CooperativeFarmRepository {
    async create(data: CreateFarmInput): Promise<CooperativeFarm> {
        return prisma.cooperativeFarm.create({
            data: {
                ...data,
                lastHarvest: data.lastHarvest ? new Date(data.lastHarvest) : null,
                nextHarvestEst: data.nextHarvestEst ? new Date(data.nextHarvestEst) : null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
    }

    async update(id: string, data: Partial<CreateFarmInput> & { status?: string }): Promise<CooperativeFarm> {
        const { lastHarvest, nextHarvestEst, ...rest } = data;
        const updateData: any = { ...rest, updatedAt: new Date() };

        if (lastHarvest) updateData.lastHarvest = new Date(lastHarvest);
        if (nextHarvestEst) updateData.nextHarvestEst = new Date(nextHarvestEst);

        return prisma.cooperativeFarm.update({
            where: { id },
            data: updateData
        });
    }

    async findAll(memberId?: string): Promise<CooperativeFarm[]> {
        const where: any = {};
        if (memberId) where.memberId = memberId;

        return prisma.cooperativeFarm.findMany({
            where,
            include: {
                Member: { select: { firstName: true, lastName: true, photoUrl: true, memberCode: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id: string): Promise<CooperativeFarm | null> {
        return prisma.cooperativeFarm.findUnique({
            where: { id },
            include: {
                Member: { select: { firstName: true, lastName: true, photoUrl: true, memberCode: true } }
            }
        });
    }

    async delete(id: string): Promise<CooperativeFarm> {
        return prisma.cooperativeFarm.delete({
            where: { id }
        });
    }
}

export const cooperativeFarmRepository = new CooperativeFarmRepository();
