import { NextResponse } from 'next/server';
import { companySettingsService } from '@/services/company-settings.service';

/**
 * PATCH /api/settings/company/[id]
 * Update company settings
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const settings = await companySettingsService.updateSettings(params.id, body);
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 400 }
    );
  }
}
