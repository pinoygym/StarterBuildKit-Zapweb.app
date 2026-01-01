import { NextResponse } from 'next/server';
import { apService } from '@/services/ap.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await apService.getAPById(id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'AP record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error fetching AP record:', error);
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
    await apService.deleteAP(id);

    return NextResponse.json({ success: true, message: 'AP record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting AP record:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
