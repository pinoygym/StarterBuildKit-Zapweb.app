import { NextRequest, NextResponse } from 'next/server';
import { companySettingsService } from '@/services/company-settings.service';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';

export const dynamic = 'force-dynamic';

// GET /api/settings/company - Get company settings
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

    const settings = await companySettingsService.getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/settings/company
 * Update company settings
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const currentSettings = await companySettingsService.getSettings();
    const settings = await companySettingsService.updateSettings(currentSettings.id, body);
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}
