import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanySettingsService } from '@/services/company-settings.service';
import { prisma } from '@/lib/prisma';

// Mock prisma
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
  let companySettingsService: CompanySettingsService;

  beforeEach(() => {
    companySettingsService = new CompanySettingsService();
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return existing settings', async () => {
      const mockSettings = { id: 'default', companyName: 'Existing Company' };
      vi.mocked(prisma.companySettings.findFirst).mockResolvedValue(mockSettings as any);

      const result = await companySettingsService.getSettings();

      expect(result).toEqual(mockSettings);
      expect(prisma.companySettings.findFirst).toHaveBeenCalled();
      expect(prisma.companySettings.create).not.toHaveBeenCalled();
    });

    it('should create and return default settings if none exist', async () => {
      vi.mocked(prisma.companySettings.findFirst).mockResolvedValue(null);
      const mockCreatedSettings = {
        id: 'default',
        companyName: 'My Company',
        vatEnabled: false,
        vatRate: 12.0,
      };
      vi.mocked(prisma.companySettings.create).mockResolvedValue(mockCreatedSettings as any);

      const result = await companySettingsService.getSettings();

      expect(result).toEqual(mockCreatedSettings);
      expect(prisma.companySettings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyName: 'My Company',
          id: 'default',
        }),
      });
    });

    it('should throw error if creation fails', async () => {
      vi.mocked(prisma.companySettings.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.companySettings.create).mockRejectedValue(new Error('DB Error'));

      await expect(companySettingsService.getSettings()).rejects.toThrow('DB Error');
    });
  });

  describe('updateSettings', () => {
    it('should update settings successfully', async () => {
      const mockUpdatedSettings = { id: 'default', companyName: 'Updated Company' };
      vi.mocked(prisma.companySettings.update).mockResolvedValue(mockUpdatedSettings as any);

      const result = await companySettingsService.updateSettings('default', { companyName: 'Updated Company' });

      expect(result).toEqual(mockUpdatedSettings);
      expect(prisma.companySettings.update).toHaveBeenCalledWith({
        where: { id: 'default' },
        data: { companyName: 'Updated Company' },
      });
    });
  });
});
