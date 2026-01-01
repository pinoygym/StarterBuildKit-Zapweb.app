
import { BackupService } from '../services/backup.service';
import { prisma } from '../lib/prisma';
import fs from 'fs';

async function main() {
    console.log('Testing BackupService.restoreBackup()...');

    try {
        // Read backup from file
        console.log('Reading production backup from file...');
        const backupData = fs.readFileSync('prod-backup.json', 'utf-8');
        const backup = JSON.parse(backupData);

        // Attempt restore
        console.log('Attempting restore with PRODUCTION data...');
        await BackupService.restoreBackup(backup);
        console.log('Restore successful!');
    } catch (error: any) {
        console.error('Restore failed!');
        console.error('Error message:', error.message);
        if (error.code) console.error('Error code:', error.code);
        if (error.meta) console.error('Error meta:', JSON.stringify(error.meta, null, 2));
        if (error.clientVersion) console.error('Client Version:', error.clientVersion);
    } finally {
        process.exit(0);
    }
}

main();
