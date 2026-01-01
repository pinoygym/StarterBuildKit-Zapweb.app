import { NextResponse } from 'next/server';
import { alertService } from '@/services/alert.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;

    const counts = await alertService.getAlertCounts(branchId);

    return NextResponse.json({ success: true, data: counts });
  } catch (error: any) {
    console.error('Error fetching alert counts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
