import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/services/settings.service';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// POST /api/settings/database/clear - Clear all data from database
export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication
    const token = request.cookies.get('auth-token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = authService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // 2. Verify Super Mega Admin Status
    const user = await userService.getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Explicitly cast to any to access isSuperMegaAdmin if type definition is missing it
    if (!(user as any).isSuperMegaAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    // 3. Perform Cleanup
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
