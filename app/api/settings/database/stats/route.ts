import { settingsService } from '@/services/settings.service';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { AppError } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET /api/settings/database/stats - Get database statistics
export async function GET(request: NextRequest) {
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
    if (!user || !(user as any).isSuperMegaAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

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
