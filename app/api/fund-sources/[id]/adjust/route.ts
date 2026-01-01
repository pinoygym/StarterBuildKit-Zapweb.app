import { NextRequest, NextResponse } from 'next/server';
import { fundSourceService } from '@/services/fund-source.service';
import { authService } from '@/services/auth.service';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// POST /api/fund-sources/[id]/adjust - Adjust fund source balance for reconciliation
export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    try {
        let userId: string | undefined;
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        try {
            const payload = authService.verifyToken(token);
            userId = payload?.userId;
        } catch (err) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const body = await request.json();

        if (body.newBalance === undefined || body.newBalance === null) {
            return NextResponse.json(
                { error: 'New balance is required' },
                { status: 400 }
            );
        }

        if (!body.reason) {
            return NextResponse.json(
                { error: 'Reason for adjustment is required' },
                { status: 400 }
            );
        }

        const result = await fundSourceService.adjustBalance({
            fundSourceId: id,
            newBalance: body.newBalance,
            reason: body.reason,
            createdById: userId,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error adjusting balance:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to adjust balance' },
            { status: error instanceof Error && error.message.includes('not found') ? 404 : 400 }
        );
    }
}
