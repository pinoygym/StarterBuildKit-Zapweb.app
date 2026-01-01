import { NextRequest, NextResponse } from 'next/server';
import { inventoryAdjustmentService } from '@/services/inventory-adjustment.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        const payload = authService.verifyToken(token);
        if (!payload?.userId) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

        const resolvedParams = await params;
        const adjustment = await inventoryAdjustmentService.post(resolvedParams.id, payload.userId);
        return NextResponse.json({ success: true, data: adjustment });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: 'Failed to post adjustment' }, { status: 500 });
    }
}
