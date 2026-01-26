import { prisma } from '@/lib/prisma';
import { CooperativeTask, TaskAssignment } from '@prisma/client';
import { CreateTaskInput } from '@/types/cooperative.types';

export class CooperativeTaskRepository {
    async create(data: CreateTaskInput): Promise<CooperativeTask> {
        const { dueDate, ...rest } = data;
        return prisma.cooperativeTask.create({
            data: {
                ...rest,
                dueDate: dueDate ? new Date(dueDate) : null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
    }

    async assign(taskId: string, memberId: string): Promise<TaskAssignment> {
        // Upsert to handle re-assignment or existing
        return prisma.taskAssignment.upsert({
            where: {
                taskId_memberId: { taskId, memberId }
            },
            create: {
                taskId,
                memberId,
                status: 'assigned',
                assignedAt: new Date()
            },
            update: {
                status: 'assigned',
                assignedAt: new Date()
            }
        });
    }

    async updateAssignmentStatus(taskId: string, memberId: string, status: string, xpEarned?: number): Promise<TaskAssignment> {
        // Find assignment id first or use composite unique key if prisma supports update with compound key (it does)
        return prisma.taskAssignment.update({
            where: {
                taskId_memberId: { taskId, memberId }
            },
            data: {
                status,
                completedAt: status === 'completed' ? new Date() : undefined,
                xpEarned
            }
        });
    }

    async findAll(filters?: { status?: string; initiativeId?: string }): Promise<CooperativeTask[]> {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.initiativeId) where.initiativeId = filters.initiativeId;

        return prisma.cooperativeTask.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                Assignments: {
                    include: { Member: { select: { firstName: true, lastName: true, photoUrl: true } } }
                }
            }
        });
    }

    async findById(id: string): Promise<CooperativeTask | null> {
        return prisma.cooperativeTask.findUnique({
            where: { id },
            include: {
                Initiative: { select: { title: true } },
                Assignments: {
                    include: { Member: { select: { firstName: true, lastName: true, photoUrl: true } } }
                }
            }
        });
    }

    async findMemberTasks(memberId: string): Promise<TaskAssignment[]> {
        return prisma.taskAssignment.findMany({
            where: { memberId },
            include: {
                Task: true
            },
            orderBy: { assignedAt: 'desc' }
        });
    }
}

export const cooperativeTaskRepository = new CooperativeTaskRepository();
