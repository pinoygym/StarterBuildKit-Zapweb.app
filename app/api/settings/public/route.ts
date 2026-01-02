import { NextResponse } from 'next/server';
import { companySettingsService } from '@/services/company-settings.service';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await companySettingsService.getPublicSettings();
        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error: any) {
        console.error('[API][Settings][Public] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch public settings' },
            { status: 500 }
        );
    }
}
