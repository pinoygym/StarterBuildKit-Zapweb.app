import { NextRequest, NextResponse } from 'next/server';
import { posService } from '@/services/pos.service';
import { AppError } from '@/lib/errors';

// GET /api/pos/sales/[id] - Fetch single POS sale with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await posService.getSaleById(id);
    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    console.error('Error fetching POS sale:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch POS sale' },
      { status: 500 }
    );
  }
}
