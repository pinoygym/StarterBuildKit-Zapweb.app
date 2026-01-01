import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard.service';
import { authService } from '@/services/auth.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Optional authentication - dashboard can work without it
        let userId = undefined;
        const token = request.cookies.get('auth-token')?.value;
        if (token) {
            try {
                const payload = authService.verifyToken(token);
                userId = payload?.userId;
            } catch (err) {
                console.error('Error verifying token in GET /api/dashboard/recent-activities:', err);
            }
        }

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId') || undefined;
        const limit = parseInt(searchParams.get('limit') || '10');

        const activities = await dashboardService.getRecentActivities(limit, branchId);

        return NextResponse.json({ success: true, data: activities });
    } catch (error: any) {
        console.error('Error fetching dashboard recent activities:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch recent activities',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
