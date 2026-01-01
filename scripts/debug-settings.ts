
import { companySettingsService } from '@/services/company-settings.service';
import { prisma } from '@/lib/prisma';

async function main() {
    try {
        console.log('Testing companySettingsService.getSettings()...');
        const settings = await companySettingsService.getSettings();
        console.log('Settings retrieved successfully:', settings);
    } catch (error) {
        console.error('Error retrieving settings:');
        console.error(error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
