import { idTemplateRepository } from '@/repositories/id-template.repository';
import { CreateIDTemplateInput } from '@/types/cooperative.types';

export class IDTemplateService {
    async createTemplate(data: CreateIDTemplateInput) {
        if (!data.name) throw new Error('Template name is required');
        return await idTemplateRepository.create(data);
    }

    async updateTemplate(id: string, data: Partial<CreateIDTemplateInput>) {
        return await idTemplateRepository.update(id, data);
    }

    async getTemplates() {
        return await idTemplateRepository.findAll();
    }

    async getDefaultTemplate() {
        return await idTemplateRepository.findDefault();
    }

    async setDefaultTemplate(id: string) {
        return await idTemplateRepository.setDefault(id);
    }

    async deleteTemplate(id: string) {
        return await idTemplateRepository.delete(id);
    }
}

export const idTemplateService = new IDTemplateService();
