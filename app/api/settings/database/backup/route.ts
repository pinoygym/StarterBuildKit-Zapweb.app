import { NextResponse } from 'next/server';
import { BackupService } from '@/services/backup.service';
import { asyncHandler } from '@/lib/api-error';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async () => {
    const backupData = await BackupService.createBackup();

    // Get company name from settings
    const companySettings = await prisma.companySettings.findFirst();
    const companyName = companySettings?.companyName || 'backup';

    // Format company name for filename (remove special chars, replace spaces with underscores)
    const sanitizedCompanyName = companyName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50); // Limit length

    // Format date and time: YYYY-MM-DD_HH-MM-SS
    const now = new Date();
    const dateTime = now.toISOString()
        .replace('T', '_')
        .replace(/:/g, '-')
        .split('.')[0];

    const filename = `${sanitizedCompanyName}_${dateTime}.json`;

    // Include filename in the response body for reliable access
    const responseData = {
        ...backupData,
        _filename: filename,
    };

    return new NextResponse(JSON.stringify(responseData, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`,

        },
    });
});
