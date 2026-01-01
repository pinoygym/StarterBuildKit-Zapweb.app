import { NextResponse } from 'next/server';
import { companySettingsService } from '@/services/company-settings.service';

/**
 * GET /api/settings/company
 * Get company settings
 */
export async function GET() {
  try {
    const settings = await companySettingsService.getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}
