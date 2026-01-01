import { NextResponse } from 'next/server';
import { BackupService } from '@/services/backup.service';
import { asyncHandler } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async () => {
    const backupData = await BackupService.createBackup();
    const date = new Date().toISOString().split('T')[0];
    const filename = `backup-${date}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
});
