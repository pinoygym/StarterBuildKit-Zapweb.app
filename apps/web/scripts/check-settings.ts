import { prisma } from '../lib/prisma';

async function main() {
    try {
        console.log('Attempting to fetch company settings...');
        const settings = await prisma.companySettings.findFirst();
        console.log('Settings found:', JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error fetching settings:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
