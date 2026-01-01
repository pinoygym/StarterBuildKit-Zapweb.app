
import { BackupService } from '../services/backup.service';
import { prisma } from '../lib/prisma'; // Importing to ensure connection is ready/shared

async function main() {
    console.log('Testing FULL BackupService.createBackup()...');
    try {
        const backup = await BackupService.createBackup();
        console.log('Backup successful!');
        console.log('Keys in backup:', Object.keys(backup.data));
    } catch (error: any) {
        console.error('Backup failed!');
        console.error('Error message:', error.message);
        if (error.code) console.error('Error code:', error.code);
        if (error.meta) console.error('Error meta:', JSON.stringify(error.meta, null, 2));
        if (error.clientVersion) console.error('Client Version:', error.clientVersion);
    } finally {
        // await prisma.$disconnect(); 
        // Usually not needed if process exits, but good practice if script hangs
        process.exit(0);
    }
}

main();
