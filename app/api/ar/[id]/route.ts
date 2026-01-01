import { NextResponse } from 'next/server';
import { arService } from '@/services/ar.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await arService.getARById(id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'AR record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error fetching AR record:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await arService.deleteAR(id);

    return NextResponse.json({ success: true, message: 'AR record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting AR record:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
