import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId') || undefined;
        const limit = parseInt(searchParams.get('limit') || '10');

        const activities = await dashboardService.getRecentActivities(limit, branchId);

        return NextResponse.json({ success: true, data: activities });
    } catch (error: any) {
        console.error('Error fetching dashboard recent activities:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
