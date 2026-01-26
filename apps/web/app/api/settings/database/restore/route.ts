import { NextRequest, NextResponse } from 'next/server';
import { BackupService } from '@/services/backup.service';
import { asyncHandler } from '@/lib/api-error';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export const POST = asyncHandler(async (req: Request) => {
    try {
        console.log('[Restore API] Starting restore process...');

        // Parse and validate backup data
        let backupData;
        try {
            backupData = await req.json();
        } catch (parseError) {
            console.error('[Restore API] Failed to parse JSON:', parseError);
            return NextResponse.json(
                { success: false, error: 'Invalid JSON format in backup file' },
                { status: 400 }
            );
        }

        // Validate backup structure
        if (!backupData) {
            console.error('[Restore API] Backup data is null or undefined');
            return NextResponse.json(
                { success: false, error: 'Backup data is empty' },
                { status: 400 }
            );
        }

        if (!backupData.version) {
            console.error('[Restore API] Missing version field');
            return NextResponse.json(
                { success: false, error: 'Invalid backup file: missing version field' },
                { status: 400 }
            );
        }

        if (!backupData.data) {
            console.error('[Restore API] Missing data field');
            return NextResponse.json(
                { success: false, error: 'Invalid backup file: missing data field' },
                { status: 400 }
            );
        }

        console.log('[Restore API] Backup validation passed, version:', backupData.version);
        console.log('[Restore API] Calling BackupService.restoreBackup...');

        // Attempt restore
        await BackupService.restoreBackup(backupData);

        console.log('[Restore API] Restore completed successfully');
        return NextResponse.json({
            success: true,
            data: { message: 'Database restored successfully' },
        });

    } catch (error: any) {
        console.error('[Restore API] Restore operation failed:');
        console.error('[Restore API] Error name:', error?.name);
        console.error('[Restore API] Error message:', error?.message);
        console.error('[Restore API] Error stack:', error?.stack);

        // Handle specific Prisma errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error('[Restore API] Prisma error code:', error.code);
            console.error('[Restore API] Prisma meta:', error.meta);

            return NextResponse.json(
                {
                    success: false,
                    error: `Database error: ${error.message}`,
                    code: error.code
                },
                { status: 500 }
            );
        }

        if (error instanceof Prisma.PrismaClientValidationError) {
            console.error('[Restore API] Prisma validation error');
            return NextResponse.json(
                {
                    success: false,
                    error: 'Data validation failed: The backup data contains invalid values',
                    details: error.message
                },
                { status: 400 }
            );
        }

        // Handle generic errors
        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'An unknown error occurred during restore',
                type: error?.name || 'Unknown'
            },
            { status: 500 }
        );
    }
});
