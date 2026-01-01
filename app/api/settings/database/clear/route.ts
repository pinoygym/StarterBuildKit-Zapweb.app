import { NextResponse } from 'next/server';
import { settingsService } from '@/services/settings.service';
import { AppError } from '@/lib/errors';

// POST /api/settings/database/clear - Clear all data from database
export async function POST() {
  try {
    const result = await settingsService.clearDatabase();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error clearing database:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to clear database' },
      { status: 500 }
    );
  }
}
