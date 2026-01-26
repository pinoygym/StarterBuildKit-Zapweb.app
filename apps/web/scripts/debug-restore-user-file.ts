
import { BackupService } from '@/services/backup.service';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

async function main() {
    try {
        const backupPath = path.join(process.cwd(), 'Ormoc_Buenas_Shoppers_2025-12-31_08-39-49.json');
        console.log(`Reading backup file from: ${backupPath}`);

        const fileContent = await fs.readFile(backupPath, 'utf8');
        const backupData = JSON.parse(fileContent);

        console.log(`Backup loaded. Version: ${backupData.version}`);
        console.log('Starting restore...');

        await BackupService.restoreBackup(backupData);

        console.log('Restore completed successfully!');
    } catch (error) {
        console.error('Restore failed with error:');
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
