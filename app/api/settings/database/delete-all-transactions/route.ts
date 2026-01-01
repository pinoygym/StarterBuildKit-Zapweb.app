import { NextResponse } from 'next/server';
import { settingsService } from '@/services/settings.service';
import { AppError } from '@/lib/errors';
import { BackupService } from '@/services/backup.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// POST /api/settings/database/delete-transactions-final - Delete all transactions but keep master data
export async function POST() {
    try {
        // Create backup before deleting transactions
        console.log('[Delete Transactions] Creating backup before deleting transactions...');
        const backup = await BackupService.createBackupWithMetadata('before_delete_transactions');
        console.log(`[Delete Transactions] Backup created: ${backup._filename}`);

        const result = await settingsService.deleteTransactions();

        // Return both the result and the backup
        return NextResponse.json({ success: true, data: result, backup: backup });
    } catch (error) {
        console.error('Error deleting transactions:', error);

        if (error instanceof AppError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to delete transactions' },
            { status: 500 }
        );
    }
}
