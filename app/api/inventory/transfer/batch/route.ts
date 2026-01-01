import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';
import { TransferStockBatchInput } from '@/types/inventory.types';

export const dynamic = 'force-dynamic';

// POST /api/inventory/transfer/batch - Transfer multiple stocks between warehouses
export async function POST(request: NextRequest) {
    try {
        const body: TransferStockBatchInput = await request.json();

        await inventoryService.transferStocks(body);

        return NextResponse.json(
            { success: true, message: 'Stocks transferred successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error transferring stocks:', error);

        if (error instanceof AppError) {
            return NextResponse.json(
                { success: false, error: error.message, fields: (error as any).fields },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to transfer stocks' },
            { status: 500 }
        );
    }
}
