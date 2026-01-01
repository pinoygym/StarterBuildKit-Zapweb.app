import { asyncHandler } from '@/lib/api-error';
import { companySettingsService } from '@/services/company-settings.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/company
 * Get company settings
 */
export const GET = asyncHandler(async () {
  try {
    const settings = await companySettingsService.getSettings();
    return Response.json({ success: true, data: settings });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}
