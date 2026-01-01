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
        console.error('Error verifying token in GET /api/dashboard/kpis:', err);
      }
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;

    const kpis = await dashboardService.getKPIs({ branchId });

    return NextResponse.json({ success: true, data: kpis });
  } catch (error: any) {
    console.error('Error fetching dashboard KPIs:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch dashboard KPIs',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
