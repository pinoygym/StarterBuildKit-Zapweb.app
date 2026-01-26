import { NextRequest, NextResponse } from 'next/server';
import { inventoryTransferService } from '@/services/inventory-transfer.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';
import { TransferStatus } from '@/types/inventory-transfer.types';

export const dynamic = 'force-dynamic';

// GET /api/inventory/transfers - List all transfer slips with filtering
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const payload = authService.verifyToken(token);
        if (!payload?.userId) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sourceWarehouseId = searchParams.get('sourceWarehouseId') || undefined;
        const destinationWarehouseId = searchParams.get('destinationWarehouseId') || undefined;
        const branchId = searchParams.get('branchId') || undefined;
        const status = searchParams.get('status') as TransferStatus | undefined;
        const searchQuery = searchParams.get('searchQuery') || undefined;
        const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
        const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const result = await inventoryTransferService.findAll({
            sourceWarehouseId,
            destinationWarehouseId,
            branchId,
            status,
            searchQuery,
            dateFrom,
            dateTo,
            page,
            limit,
        });

        return NextResponse.json({ success: true, ...result }, { status: 200 });
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: 'Failed to fetch transfers' }, { status: 500 });
    }
}

// POST /api/inventory/transfers - Create a new draft transfer
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const payload = authService.verifyToken(token);
        if (!payload?.userId) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const transfer = await inventoryTransferService.create(body, payload.userId);

        return NextResponse.json({ success: true, data: transfer }, { status: 201 });
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: 'Failed to create transfer' }, { status: 500 });
    }
}
