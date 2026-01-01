import { NextResponse } from 'next/server';
import { settingsService } from '@/services/settings.service';
import { AppError } from '@/lib/errors';

// GET /api/settings/database/stats - Get database statistics
export async function GET() {
  try {
    const stats = await settingsService.getDatabaseStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching database stats:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch database statistics' },
      { status: 500 }
    );
  }
}
