import { NextResponse } from 'next/server';
import { settingsService } from '@/services/settings.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// POST /api/settings/database/cleanup-test-customers - Clean up test customers
export async function POST() {
    try {
        const result = await settingsService.cleanupTestCustomers();
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Error cleaning up test customers:', error);

        if (error instanceof AppError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to clean up test customers' },
            { status: 500 }
        );
    }
}
