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

  async updateSettings(id: string, data: Partial<CompanySettings>): Promise<CompanySettings> {
    return await prisma.companySettings.update({
      where: { id },
      data,
    });
  }

  /**
   * Get public company settings (company name and logo)
   */
  async getPublicSettings(): Promise<{ companyName: string; logoUrl: string | null }> {
    try {
      const settings = await this.getSettings();
      return {
        companyName: settings.companyName,
        logoUrl: settings.logoUrl,
      };
    } catch (error) {
      console.error('[CompanySettingsService] Error getting public settings:', error);
      return {
        companyName: 'InventoryPro',
        logoUrl: null,
      };
    }
  }
}

export const companySettingsService = new CompanySettingsService();
