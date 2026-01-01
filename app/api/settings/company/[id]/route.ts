import { NextRequest, NextResponse } from 'next/server';
import { companySettingsService } from '@/services/company-settings.service';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/settings/company/[id]
 * Update company settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const settings = await companySettingsService.updateSettings(id, body);
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 400 }
    );
  }
}
