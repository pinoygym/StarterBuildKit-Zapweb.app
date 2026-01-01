import { NextResponse } from 'next/server';
import { arService } from '@/services/ar.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;

    const report = await arService.getAgingReport(branchId);

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating AR aging report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
