import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/inventory/adjustments - List all adjustment slips with filtering
export async function GET(request: NextRequest) {
    try {
        // Authenticate User
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const payload = authService.verifyToken(token);
        if (!payload?.userId) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const warehouseId = searchParams.get('warehouseId') || undefined;
        const productId = searchParams.get('productId') || undefined;
        const searchQuery = searchParams.get('search') || undefined;
        const dateFrom = searchParams.get('dateFrom')
            ? new Date(searchParams.get('dateFrom')!)
            : undefined;
        const dateTo = searchParams.get('dateTo')
            ? new Date(searchParams.get('dateTo')!)
            : undefined;

        // Get adjustment slips with filters
        const adjustments = await inventoryService.getAdjustmentSlips({
            warehouseId,
            productId,
            searchQuery,
            dateFrom,
            dateTo,
        });

        return NextResponse.json(
            { success: true, data: adjustments },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching adjustments:', error);

        if (error instanceof AppError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to fetch adjustments' },
            { status: 500 }
        );
    }
}
