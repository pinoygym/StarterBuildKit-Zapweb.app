import { prisma } from '@/lib/prisma';
import { CompanySettings } from '@prisma/client';

export class CompanySettingsService {
  /**
   * Get company settings (creates default if not exists)
   */
  async getSettings(): Promise<CompanySettings> {
    console.log('[CompanySettingsService] Attempting to find existing settings...');
    let settings = await prisma.companySettings.findFirst();
    console.log('[CompanySettingsService] Found settings:', settings ? 'YES' : 'NO');

    if (!settings) {
      console.log('[CompanySettingsService] No settings found, creating default settings...');
      try {
        settings = await prisma.companySettings.create({
          data: {
            id: 'default', // Adding required id field
            companyName: 'My Company',
            address: '',
            vatEnabled: false,
            vatRate: 12.0,
            taxInclusive: true,
            maxDiscountPercentage: 50.0,
            requireDiscountApproval: false,
            discountApprovalThreshold: 20.0,
            updatedAt: new Date(), // Required field without default
          },
        });
        console.log('[CompanySettingsService] Default settings created successfully');
      } catch (error) {
        console.error('[CompanySettingsService] Error creating default settings:', error);
        throw error;
      }
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
