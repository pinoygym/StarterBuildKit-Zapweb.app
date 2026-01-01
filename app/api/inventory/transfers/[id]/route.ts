import { NextRequest, NextResponse } from 'next/server';
import { inventoryTransferService } from '@/services/inventory-transfer.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/inventory/transfers/[id] - Get transfer details
export async function GET(
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

        const transfer = await inventoryTransferService.findById(id);
        return NextResponse.json({ success: true, data: transfer }, { status: 200 });
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: 'Failed to fetch transfer details' }, { status: 500 });
    }
}

// PATCH /api/inventory/transfers/[id] - Update a draft transfer
export async function PATCH(
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

        const body = await request.json();
        const transfer = await inventoryTransferService.update(id, body, payload.userId);

        return NextResponse.json({ success: true, data: transfer }, { status: 200 });
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: 'Failed to update transfer' }, { status: 500 });
    }
}

// DELETE /api/inventory/transfers/[id] - Delete a draft transfer
export async function DELETE(
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

        await inventoryTransferService.delete(id, payload.userId);
        return NextResponse.json({ success: true, message: 'Transfer deleted successfully' }, { status: 200 });
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: 'Failed to delete transfer' }, { status: 500 });
    }
}
