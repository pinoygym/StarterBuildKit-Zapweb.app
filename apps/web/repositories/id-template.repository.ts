import { prisma } from '@/lib/prisma';
import { IDCardTemplate } from '@prisma/client';
import { CreateIDTemplateInput } from '@/types/cooperative.types';

export class IDTemplateRepository {
    async create(data: CreateIDTemplateInput): Promise<IDCardTemplate> {
        return prisma.iDCardTemplate.create({
            data: {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
    }

    async update(id: string, data: Partial<CreateIDTemplateInput>): Promise<IDCardTemplate> {
        return prisma.iDCardTemplate.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });
    }

    async findAll(): Promise<IDCardTemplate[]> {
        return prisma.iDCardTemplate.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async findById(id: string): Promise<IDCardTemplate | null> {
        return prisma.iDCardTemplate.findUnique({
            where: { id }
        });
    }

    async findDefault(): Promise<IDCardTemplate | null> {
        return prisma.iDCardTemplate.findFirst({
            where: { isDefault: true }
        });
    }

    async setDefault(id: string): Promise<void> {
        // Unset others
        await prisma.iDCardTemplate.updateMany({
            where: { isDefault: true },
            data: { isDefault: false }
        });

        // Set new default
        await prisma.iDCardTemplate.update({
            where: { id },
            data: { isDefault: true }
        });
    }

    async delete(id: string): Promise<IDCardTemplate> {
        return prisma.iDCardTemplate.delete({
            where: { id }
        });
    }
}

export const idTemplateRepository = new IDTemplateRepository();
