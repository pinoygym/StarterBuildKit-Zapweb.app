import { NextResponse } from 'next/server';
import { apService } from '@/services/ap.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;

    const report = await apService.getAgingReport(branchId);

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating AP aging report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
