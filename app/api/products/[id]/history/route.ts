import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/products/[id]/history - Fetch product history (stock card)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await params;
        const searchParams = request.nextUrl.searchParams;

        const filters = {
            warehouseId: searchParams.get('warehouseId') || undefined,
            dateFrom: searchParams.get('dateFrom')
                ? new Date(searchParams.get('dateFrom')!)
                : undefined,
            dateTo: searchParams.get('dateTo')
                ? new Date(searchParams.get('dateTo')!)
                : undefined,
        };

        const history = await inventoryService.getProductHistory(productId, filters);
        return NextResponse.json({ success: true, data: history });
    } catch (error) {
        console.error('Error fetching product history:', error);

        if (error instanceof AppError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to fetch product history' },
            { status: 500 }
        );
    }
}
