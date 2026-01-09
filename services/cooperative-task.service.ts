import { cooperativeTaskRepository } from '@/repositories/cooperative-task.repository';
import { CreateTaskInput } from '@/types/cooperative.types';
import { prisma } from '@/lib/prisma';

export class CooperativeTaskService {
    async createTask(data: CreateTaskInput) {
        if (!data.title) throw new Error('Title is required');
        return await cooperativeTaskRepository.create(data);
    }

    async assignTask(taskId: string, memberId: string) {
        return await cooperativeTaskRepository.assign(taskId, memberId);
    }

    async completeTask(taskId: string, memberId: string) {
        const task = await cooperativeTaskRepository.findById(taskId);
        if (!task) throw new Error('Task not found');

        // 1. Update assignment status
        const assignment = await cooperativeTaskRepository.updateAssignmentStatus(taskId, memberId, 'completed', task.xpReward);

        // 2. Award XP to member
        await this.addMemberXp(memberId, task.xpReward);

        return assignment;
    }

    async getTasks(filters?: { status?: string; initiativeId?: string }) {
        return await cooperativeTaskRepository.findAll(filters);
    }

    async getTaskById(id: string) {
        const task = await cooperativeTaskRepository.findById(id);
        if (!task) throw new Error('Task not found');
        return task;
    }

    async getMemberTasks(memberId: string) {
        return await cooperativeTaskRepository.findMemberTasks(memberId);
    }

    private async addMemberXp(memberId: string, amount: number) {
        // Upsert engagement score
        await prisma.memberEngagementScore.upsert({
            where: { memberId },
            create: {
                memberId,
                totalXp: amount,
                tasksCompleted: 1
            },
            update: {
                totalXp: { increment: amount },
                tasksCompleted: { increment: 1 }
            }
        });
    }
}

export const cooperativeTaskService = new CooperativeTaskService();
