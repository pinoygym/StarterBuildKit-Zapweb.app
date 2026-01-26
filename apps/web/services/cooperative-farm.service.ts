import { cooperativeFarmRepository } from '@/repositories/cooperative-farm.repository';
import { CreateFarmInput } from '@/types/cooperative.types';

export class CooperativeFarmService {
    async registerFarm(data: CreateFarmInput) {
        if (!data.name) throw new Error('Farm name is required');
        if (!data.memberId) throw new Error('Member ID is required');

        return await cooperativeFarmRepository.create(data);
    }

    async updateFarm(id: string, data: Partial<CreateFarmInput> & { status?: string }) {
        return await cooperativeFarmRepository.update(id, data);
    }

    async getFarms(memberId?: string) {
        return await cooperativeFarmRepository.findAll(memberId);
    }

    async getFarmById(id: string) {
        const farm = await cooperativeFarmRepository.findById(id);
        if (!farm) throw new Error('Farm not found');
        return farm;
    }

    async deleteFarm(id: string) {
        return await cooperativeFarmRepository.delete(id);
    }
}

export const cooperativeFarmService = new CooperativeFarmService();
