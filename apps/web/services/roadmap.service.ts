import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const roadmapService = {
    // --- Roadmap Items ---

    async createItem(data: {
        title: string;
        description: string;
        status: string;
        priority: string;
        authorId: string;
        tags?: string[];
        targetDate?: Date | null;
    }) {
        return prisma.roadmapItem.create({
            data: {
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
                authorId: data.authorId,
                tags: data.tags || [],
                targetDate: data.targetDate,
            },
            include: {
                Author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                _count: {
                    select: { comments: true },
                },
            },
        });
    },

    async getItems(filter?: { status?: string; priority?: string }) {
        const where: Prisma.RoadmapItemWhereInput = {};
        if (filter?.status) where.status = filter.status;
        if (filter?.priority) where.priority = filter.priority;

        return prisma.roadmapItem.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                Author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                _count: {
                    select: { comments: true },
                },
            },
        });
    },

    async getItemById(id: string) {
        return prisma.roadmapItem.findUnique({
            where: { id },
            include: {
                Author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                comments: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        User: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
    },

    async updateItem(
        id: string,
        data: {
            title?: string;
            description?: string;
            status?: string;
            priority?: string;
            tags?: string[];
            targetDate?: Date | null;
        }
    ) {
        return prisma.roadmapItem.update({
            where: { id },
            data,
            include: {
                Author: true,
            },
        });
    },

    async deleteItem(id: string) {
        return prisma.roadmapItem.delete({
            where: { id },
        });
    },

    // --- Comments ---

    async addComment(data: {
        content: string;
        roadmapItemId: string;
        userId: string;
    }) {
        return prisma.roadmapComment.create({
            data: {
                content: data.content,
                roadmapItemId: data.roadmapItemId,
                userId: data.userId,
            },
            include: {
                User: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    },

    async getComments(roadmapItemId: string) {
        return prisma.roadmapComment.findMany({
            where: { roadmapItemId },
            orderBy: { createdAt: "asc" },
            include: {
                User: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    },
};
