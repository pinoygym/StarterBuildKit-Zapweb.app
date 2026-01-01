import { NextRequest, NextResponse } from 'next/server';
import { inventoryAdjustmentService } from '@/services/inventory-adjustment.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';
import { AdjustmentStatus } from '@/types/inventory-adjustment.types';

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
        const branchId = searchParams.get('branchId') || undefined;
        const status = searchParams.get('status') as AdjustmentStatus | undefined;
        const searchQuery = searchParams.get('searchQuery') || undefined;
        const dateFrom = searchParams.get('dateFrom')
            ? new Date(searchParams.get('dateFrom')!)
            : undefined;
        const dateTo = searchParams.get('dateTo')
            ? new Date(searchParams.get('dateTo')!)
            : undefined;

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limitParam = searchParams.get('limit');
        const limit = limitParam === 'all' ? 0 : parseInt(limitParam || '10');

        // Get adjustments with filters
        const result = await inventoryAdjustmentService.findAll({
            warehouseId,
            branchId,
            status,
            searchQuery,
            dateFrom,
            dateTo,
            page,
            limit,
        });

        return NextResponse.json(
            { success: true, ...result },
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
