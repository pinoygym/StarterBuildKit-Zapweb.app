import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/inventory/adjustments/[id] - Get adjustment slip by reference ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;

        // Get adjustment slip by ID
        const adjustment = await inventoryService.getAdjustmentSlipById(id);

        if (!adjustment) {
            return NextResponse.json(
                { success: false, error: 'Adjustment slip not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, data: adjustment },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching adjustment:', error);

        if (error instanceof AppError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to fetch adjustment' },
            { status: 500 }
        );
    }
}
