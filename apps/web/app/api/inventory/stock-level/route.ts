import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/inventory/stock-level - Fetch on-hand quantity for a product in a warehouse
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const productId = searchParams.get('productId');
        const warehouseId = searchParams.get('warehouseId');

        if (!productId || !warehouseId) {
            return NextResponse.json(
                { success: false, error: 'productId and warehouseId are required' },
                { status: 400 }
            );
        }

        const quantity = await inventoryService.getCurrentStockLevel(productId, warehouseId);

        return NextResponse.json({
            success: true,
            data: {
                productId,
                warehouseId,
                quantity
            }
        });
    } catch (error) {
        console.error('Error fetching stock level:', error);

        if (error instanceof AppError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to fetch stock level' },
            { status: 500 }
        );
    }
}
