
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { companySettingsService } from '@/services/company-settings.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        companySettings: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

describe('CompanySettingsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getSettings', () => {
        it('should return existing settings if found', async () => {
            const mockSettings = { id: 'default', companyName: 'Existing Co' };
            vi.mocked(prisma.companySettings.findFirst).mockResolvedValue(mockSettings as any);

            const result = await companySettingsService.getSettings();

            expect(result).toEqual(mockSettings);
            expect(prisma.companySettings.create).not.toHaveBeenCalled();
        });

        it('should create default settings if none found', async () => {
            vi.mocked(prisma.companySettings.findFirst).mockResolvedValue(null);
            const mockCreated = { id: 'default', companyName: 'My Company' };
            vi.mocked(prisma.companySettings.create).mockResolvedValue(mockCreated as any);

            const result = await companySettingsService.getSettings();

            expect(prisma.companySettings.create).toHaveBeenCalled();
            expect(result).toEqual(mockCreated);
        });
    });
});
