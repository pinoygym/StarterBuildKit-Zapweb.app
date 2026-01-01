import { NextRequest, NextResponse } from 'next/server';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { cancelReceivingVoucherSchema } from '@/lib/validations/receiving-voucher.validation';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// POST /api/receiving-vouchers/[id]/cancel - Cancel a receiving voucher
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = cancelReceivingVoucherSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.flatten());
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Cancel receiving voucher
    console.log('Calling receivingVoucherService.cancelReceivingVoucher...');
    const rv = await receivingVoucherService.cancelReceivingVoucher(id, validatedData);
    console.log('Receiving voucher cancelled successfully:', rv.rvNumber);

    return NextResponse.json({
      success: true,
      data: rv,
      message: `Receiving voucher ${rv.rvNumber} cancelled successfully.`,
    });
  } catch (error) {
    console.error('Error cancelling receiving voucher:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel receiving voucher',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}