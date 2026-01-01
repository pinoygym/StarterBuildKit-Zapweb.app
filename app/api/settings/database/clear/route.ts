import { asyncHandler } from '@/lib/api-error';
import { settingsService } from '@/services/settings.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// POST /api/settings/database/clear - Clear all data from database
export const POST = asyncHandler(async () {
  try {
    const result = await settingsService.clearDatabase();
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Error clearing database:', error);

    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to clear database' },
      { status: 500 }
    );
  }
}
