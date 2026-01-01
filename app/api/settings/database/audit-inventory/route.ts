
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authService } from '@/services/auth.service';
import { inventoryService } from '@/services/inventory.service';
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

        const auditResult = await inventoryService.auditInventory();

        return NextResponse.json({
            success: true,
            data: auditResult
        });

    } catch (error: any) {
        console.error('Inventory Audit Error:', error);
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: 'Failed to audit inventory' }, { status: 500 });
    }
}
