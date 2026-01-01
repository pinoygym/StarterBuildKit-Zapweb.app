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
        console.error('Error verifying token in GET /api/dashboard/branch-comparison:', err);
      }
    }

    const comparison = await dashboardService.getBranchComparison();

    return NextResponse.json({ success: true, data: comparison });
  } catch (error: any) {
    console.error('Error fetching branch comparison:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch branch comparison',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
