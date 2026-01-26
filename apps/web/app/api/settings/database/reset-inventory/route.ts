
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { authService } from '@/services/auth.service';
import { authService } from '@/services/auth.service';

export async function POST(request: NextRequest) {
    try {
        // 1. Get token from cookie
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: No token provided' },
                { status: 401 }
            );
        }

        // 2. Verify token
        const payload = authService.verifyToken(token);

        if (!payload?.userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Invalid token' },
                { status: 401 }
            );
        }

        // 3. Check if user is super admin
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { isSuperMegaAdmin: true }
        });

        if (!user?.isSuperMegaAdmin) {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Super Admin access required' },
                { status: 403 }
            );
        }

        // 4. Execute the reset logic in a transaction
        await prisma.$transaction([
            // Delete Stock Movements created by adjustments
            prisma.stockMovement.deleteMany({
                where: {
                    OR: [
                        { type: 'adjustment' },
                        { referenceType: 'adjustment' },
                        { referenceType: 'InventoryAdjustment' }
                    ]
                }
            }),
            // Reset Inventory quantities to 0
            prisma.inventory.updateMany({
                data: {
                    quantity: 0
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                message: 'Inventory reset successfully. Adjustment history cleared from products, but adjustment records preserved.'
            }
        });

    } catch (error: any) {
        console.error('Error resetting inventory:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to reset inventory' },
            { status: 500 }
        );
    }
}
