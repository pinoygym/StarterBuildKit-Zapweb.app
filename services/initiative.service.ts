import { cooperativeInitiativeRepository } from '@/repositories/cooperative-initiative.repository';
import { CreateInitiativeInput, UpdateInitiativeInput, InitiativeFilters } from '@/types/cooperative.types';

export class InitiativeService {
    async createInitiative(data: CreateInitiativeInput) {
        if (!data.title) throw new Error('Title is required');
        return await cooperativeInitiativeRepository.create(data);
    }

    async updateInitiative(id: string, data: UpdateInitiativeInput) {
        return await cooperativeInitiativeRepository.update(id, data);
    }

    async getInitiatives(filters?: InitiativeFilters) {
        return await cooperativeInitiativeRepository.findAll(filters);
    }

    async getInitiativeById(id: string) {
        const initiative = await cooperativeInitiativeRepository.findById(id);
        if (!initiative) throw new Error('Initiative not found');
        return initiative;
    }

    async deleteInitiative(id: string) {
        return await cooperativeInitiativeRepository.delete(id);
    }

    async getInitiativeStats() {
        return await cooperativeInitiativeRepository.getStats();
    }
}

export const initiativeService = new InitiativeService();
