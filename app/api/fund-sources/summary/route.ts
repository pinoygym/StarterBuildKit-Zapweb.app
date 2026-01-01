import { NextRequest, NextResponse } from 'next/server';
import { fundSourceService } from '@/services/fund-source.service';
import { authService } from '@/services/auth.service';
import { extractToken } from '@/lib/auth-utils';

// GET /api/fund-sources/summary - Get fund sources dashboard summary
export async function GET(request: NextRequest) {
    try {
        const token = extractToken(request);
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        try {
            authService.verifyToken(token);
        } catch (err) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const branchId = searchParams.get('branchId') || undefined;

        const dashboardData = await fundSourceService.getDashboardData(branchId);
        return NextResponse.json(dashboardData);
    } catch (error) {
        console.error('Error fetching fund sources summary:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch summary' },
            { status: 500 }
        );
    }
}
