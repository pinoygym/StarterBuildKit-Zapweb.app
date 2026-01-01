import { asyncHandler } from '@/lib/api-error';
import { alertService } from '@/services/alert.service';
import { AlertType, AlertSeverity } from '@/types/alert.types';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: Request) => {
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

  return Response.json({ success: true, data: alerts });
});
