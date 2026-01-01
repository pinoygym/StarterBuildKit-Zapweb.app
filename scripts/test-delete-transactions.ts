import 'dotenv/config';
import { settingsService } from '../services/settings.service';
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Testing deleteTransactions...');
    try {
        const result = await settingsService.deleteTransactions();
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
