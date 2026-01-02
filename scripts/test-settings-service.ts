import { companySettingsService } from '../services/company-settings.service';
import { prisma } from '../lib/prisma';

async function main() {
    try {
        console.log('Fetching settings via service...');
        const settings = await companySettingsService.getSettings();
        console.log('Settings fetched/created:', JSON.stringify(settings, null, 2));

        console.log('Testing public settings fetch...');
        const publicSettings = await companySettingsService.getPublicSettings();
        console.log('Public settings:', JSON.stringify(publicSettings, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
