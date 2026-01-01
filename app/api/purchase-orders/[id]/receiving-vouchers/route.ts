import { NextRequest, NextResponse } from 'next/server';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { AppError } from '@/lib/errors';

// GET /api/purchase-orders/[id]/receiving-vouchers - Get RVs for a PO
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rvs = await receivingVoucherService.getReceivingVouchersByPO(id);

    return NextResponse.json({
      success: true,
      data: rvs,
    });
  } catch (error) {
    console.error('Error fetching receiving vouchers for PO:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch receiving vouchers' },
      { status: 500 }
    );
  }
}
