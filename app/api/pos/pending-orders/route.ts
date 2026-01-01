import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { salesOrderService } from '@/services/sales-order.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/pos/pending-orders - Fetch pending sales orders for POS conversion
export const GET = asyncHandler(async (request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || undefined;

    const pendingOrders = await salesOrderService.getPendingSalesOrders(branchId);
    return Response.json({ success: true, data: pendingOrders });
  } catch (error) {
    console.error('Error fetching pending orders:', error);

    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to fetch pending orders' },
      { status: 500 }
    );
  }
}
