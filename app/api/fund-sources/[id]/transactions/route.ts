import { NextRequest, NextResponse } from 'next/server';
import { fundSourceService } from '@/services/fund-source.service';
import { authService } from '@/services/auth.service';
import { FundTransactionFilters } from '@/types/fund-source.types';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// GET /api/fund-sources/[id]/transactions - Get transaction history
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        try {
            authService.verifyToken(token);
        } catch (err) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const searchParams = request.nextUrl.searchParams;

        const filters: FundTransactionFilters = {
            type: searchParams.get('type') as FundTransactionFilters['type'] || undefined,
            referenceType: searchParams.get('referenceType') as FundTransactionFilters['referenceType'] || undefined,
            page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
            pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : undefined,
        };

        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        if (fromDate) filters.fromDate = new Date(fromDate);
        if (toDate) filters.toDate = new Date(toDate);

        const result = await fundSourceService.getTransactionHistory(id, filters);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch transactions' },
            { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
        );
    }
}

// POST /api/fund-sources/[id]/transactions - Record a manual transaction (deposit/withdrawal)
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

        if (!body.type || !body.amount) {
            return NextResponse.json(
                { error: 'Type and amount are required' },
                { status: 400 }
            );
        }

        if (body.type !== 'DEPOSIT' && body.type !== 'WITHDRAWAL') {
            return NextResponse.json(
                { error: 'Type must be DEPOSIT or WITHDRAWAL' },
                { status: 400 }
            );
        }

        let result;
        if (body.type === 'DEPOSIT') {
            result = await fundSourceService.recordDeposit(
                id,
                body.amount,
                body.description || 'Manual deposit',
                userId,
                'ADJUSTMENT',
                undefined
            );
        } else {
            result = await fundSourceService.recordWithdrawal(
                id,
                body.amount,
                body.description || 'Manual withdrawal',
                userId,
                'ADJUSTMENT',
                undefined
            );
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error recording transaction:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to record transaction' },
            { status: 400 }
        );
    }
}
