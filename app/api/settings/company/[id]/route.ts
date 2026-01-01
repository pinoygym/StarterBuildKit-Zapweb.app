import { asyncHandler } from '@/lib/api-error';
import { companySettingsService } from '@/services/company-settings.service';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/settings/company/[id]
 * Update company settings
 */
export const PATCH = asyncHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const settings = await companySettingsService.updateSettings(params.id, body);
    return Response.json({ success: true, data: settings });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: error.statusCode || 400 }
    );
  }
}
