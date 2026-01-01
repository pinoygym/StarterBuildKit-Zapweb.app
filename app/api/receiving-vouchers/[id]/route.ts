import { NextRequest, NextResponse } from 'next/server';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { AppError } from '@/lib/errors';

// GET /api/receiving-vouchers/[id] - Get single receiving voucher
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rv = await receivingVoucherService.getReceivingVoucherById(id);

    return NextResponse.json({
      success: true,
      data: rv,
    });
  } catch (error) {
    console.error('Error fetching receiving voucher:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch receiving voucher' },
      { status: 500 }
    );
  }
}
