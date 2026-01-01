import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/purchase-orders/[id]/receiving-vouchers - Get RVs for a PO
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rvs = await receivingVoucherService.getReceivingVouchersByPO(id);

    return Response.json({
      success: true,
      data: rvs,
    });
  } catch (error) {
    console.error('Error fetching receiving vouchers for PO:', error);

    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to fetch receiving vouchers' },
      { status: 500 }
    );
  }
}
