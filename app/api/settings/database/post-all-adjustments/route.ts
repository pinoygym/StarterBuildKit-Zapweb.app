import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inventoryAdjustmentService } from '@/services/inventory-adjustment.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        const payload = authService.verifyToken(token);
        if (!payload?.userId) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

        // Check if user is super admin
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { isSuperMegaAdmin: true }
        });

        if (!user?.isSuperMegaAdmin) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const drafts = await prisma.inventoryAdjustment.findMany({
            where: { status: 'DRAFT' },
            select: { id: true, adjustmentNumber: true }
        });

        if (drafts.length === 0) {
            return NextResponse.json({ success: true, data: { message: 'No draft adjustments found.' } });
        }

        const results = {
            total: drafts.length,
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const draft of drafts) {
            try {
                await inventoryAdjustmentService.post(draft.id, payload.userId);
                results.success++;
            } catch (error: any) {
                results.failed++;
                const details = error.details ? `: ${JSON.stringify(error.details)}` : '';
                results.errors.push(`${draft.adjustmentNumber}: ${error.message}${details}`);
                console.error(`Failed to post adjustment ${draft.adjustmentNumber}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                message: `Processed ${results.total} adjustments. ${results.success} succeeded, ${results.failed} failed.`,
                results
            }
        });
    } catch (error: any) {
        console.error('Mass post adjustments error:', error);
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: 'Failed to post adjustments' }, { status: 500 });
    }
}
