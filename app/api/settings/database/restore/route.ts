import { NextRequest, NextResponse } from 'next/server';
import { BackupService } from '@/services/backup.service';
import { asyncHandler } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export const POST = asyncHandler(async (req: Request) => {
    const backupData = await req.json();

    if (!backupData || !backupData.data || !backupData.version) {
        return NextResponse.json(
            { success: false, error: 'Invalid backup file format' },
            { status: 400 }
        );
    }

    await BackupService.restoreBackup(backupData);

    return NextResponse.json({
        success: true,
        data: { message: 'Database restored successfully' },
    });
});
