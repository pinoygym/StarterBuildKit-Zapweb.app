import { asyncHandler } from '@/lib/api-error';
import { settingsService } from '@/services/settings.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// POST /api/settings/database/cleanup-test-customers - Clean up test customers
export const POST = asyncHandler(async () {
    try {
        const result = await settingsService.cleanupTestCustomers();
        return Response.json({ success: true, data: result });
    } catch (error) {
        console.error('Error cleaning up test customers:', error);

        if (error instanceof AppError) {
            return Response.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        return Response.json(
            { success: false, error: 'Failed to clean up test customers' },
            { status: 500 }
        );
    }
}
