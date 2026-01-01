import { NextRequest, NextResponse } from 'next/server';
import { inventoryTransferService } from '@/services/inventory-transfer.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// POST /api/inventory/transfers/[id]/post - Post a transfer slip to inventory
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const payload = authService.verifyToken(token);
        if (!payload?.userId) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        const transfer = await inventoryTransferService.post(id, payload.userId);
        return NextResponse.json({ success: true, data: transfer }, { status: 200 });
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: 'Failed to post transfer' }, { status: 500 });
    }
}
