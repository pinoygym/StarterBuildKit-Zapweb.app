import { NextRequest, NextResponse } from 'next/server';
import { inventoryAdjustmentService } from '@/services/inventory-adjustment.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        const payload = authService.verifyToken(token);
        if (!payload?.userId) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const filters = {
            warehouseId: searchParams.get('warehouseId') || undefined,
            branchId: searchParams.get('branchId') || undefined,
            status: searchParams.get('status') as any || undefined,
            searchQuery: searchParams.get('searchQuery') || undefined,
            dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
            dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
        };

        const adjustments = await inventoryAdjustmentService.findAll(filters);
        return NextResponse.json({ success: true, data: adjustments });
    } catch (error: any) {
        console.error('Error fetching adjustments:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch adjustments' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        const payload = authService.verifyToken(token);
        if (!payload?.userId) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

        const body = await request.json();
        const adjustment = await inventoryAdjustmentService.create(body, payload.userId);

        return NextResponse.json({ success: true, data: adjustment }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating adjustment:', error);
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: 'Failed to create adjustment' }, { status: 500 });
    }
}
