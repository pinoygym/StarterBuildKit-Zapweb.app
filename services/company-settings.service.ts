import { prisma } from '@/lib/prisma';
import { CompanySettings } from '@prisma/client';

export class CompanySettingsService {
  /**
   * Get company settings (creates default if not exists)
   */
  async getSettings(): Promise<CompanySettings> {
    let settings = await prisma.companySettings.findFirst();

    if (!settings) {
      // Create default settings
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'My Company',
          address: '',
          vatEnabled: false,
          vatRate: 12.0,
          taxInclusive: true,
          maxDiscountPercentage: 50.0,
          requireDiscountApproval: false,
          discountApprovalThreshold: 20.0,
        },
      });
    }

    return settings;
  }

  /**
   * Update company settings
   */
  async updateSettings(id: string, data: Partial<CompanySettings>): Promise<CompanySettings> {
    return await prisma.companySettings.update({
      where: { id },
      data,
    });
  }
}

export const companySettingsService = new CompanySettingsService();
