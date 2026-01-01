import { NextRequest, NextResponse } from 'next/server';
import { alertService } from '@/services/alert.service';
import { authService } from '@/services/auth.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const payload = authService.verifyToken(token);
        if (!payload) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId') || undefined;
        // userId and other filters could be added here

        const alerts = await alertService.getActiveAlerts(branchId);

        return NextResponse.json({
            success: true,
            data: alerts
        });
    } catch (error: any) {
        console.error('Error fetching alerts:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch alerts' },
            { status: 500 }
        );
    }
}
