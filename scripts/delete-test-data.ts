import { settingsService } from '@/services/settings.service';
import { prisma } from '@/lib/prisma';
import * as dotenv from 'dotenv';

dotenv.config();


async function main() {
    console.log('Deleting test data (transactions)...');
    try {
        const result = await settingsService.deleteTransactions();
        console.log(result.message);
        if (result.tablesCleared && result.tablesCleared.length > 0) {
            console.log('Cleared tables:', result.tablesCleared.join(', '));
        }
    } catch (error) {
        console.error('Failed to delete transactions:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
