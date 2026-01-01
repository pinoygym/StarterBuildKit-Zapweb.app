import { NextRequest, NextResponse } from 'next/server';
import { inventoryAdjustmentService } from '@/services/inventory-adjustment.service';
import { authService } from '@/services/auth.service';
import { AppError, handlePrismaError } from '@/lib/errors';

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
        // Handle Prisma errors
        if (error.constructor.name.includes('Prisma')) {
            const appError = handlePrismaError(error);
            return NextResponse.json({ success: false, error: appError.message }, { status: appError.statusCode });
        }

        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }

        console.error('Unhandled error in POST adjustment:', error);

        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), 'debug_error.log');
            const errorMessage = error instanceof Error
                ? `${new Date().toISOString()} - ${error.message}\n${error.stack}\n\n`
                : `${new Date().toISOString()} - ${JSON.stringify(error)}\n\n`;
            fs.appendFileSync(logPath, errorMessage);
        } catch (filesysError) {
            console.error('Failed to write to debug_error.log', filesysError);
        }

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error instanceof Error ? error.stack : JSON.stringify(error)
        }, { status: 500 });
    }
}
