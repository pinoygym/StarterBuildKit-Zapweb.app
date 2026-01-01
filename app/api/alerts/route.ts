import { NextResponse } from 'next/server';
import { alertService } from '@/services/alert.service';
import { AlertType, AlertSeverity } from '@/types/alert.types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;
    const type = searchParams.get('type') as AlertType | undefined;
    const severity = searchParams.get('severity') as AlertSeverity | undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;

    const alerts = await alertService.generateAlerts({
      branchId,
      type,
      severity,
      warehouseId,
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
