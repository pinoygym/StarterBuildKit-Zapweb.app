import { NextRequest, NextResponse } from 'next/server';
import { fundSourceService } from '@/services/fund-source.service';
import { authService } from '@/services/auth.service';
import { FundTransferFilters } from '@/types/fund-source.types';
import { extractToken } from '@/lib/auth-utils';

// GET /api/fund-transfers - List all fund transfers
export async function GET(request: NextRequest) {
    try {
        const token = extractToken(request);
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        try {
            authService.verifyToken(token);
        } catch (err) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const filters: FundTransferFilters = {
            fromFundSourceId: searchParams.get('fromFundSourceId') || undefined,
            toFundSourceId: searchParams.get('toFundSourceId') || undefined,
            status: searchParams.get('status') as FundTransferFilters['status'] || undefined,
        };

        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        if (fromDate) filters.fromDate = new Date(fromDate);
        if (toDate) filters.toDate = new Date(toDate);

        const result = await fundSourceService.getAllTransfers(filters);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching fund transfers:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch fund transfers' },
            { status: 500 }
        );
    }
}

// POST /api/fund-transfers - Create a new fund transfer
export async function POST(request: NextRequest) {
    try {
        let userId: string | undefined;
        const token = extractToken(request);
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

        const body = await request.json();

        // Validate required fields
        if (!body.fromFundSourceId || !body.toFundSourceId || !body.amount) {
            return NextResponse.json(
                { error: 'From fund source, to fund source, and amount are required' },
                { status: 400 }
            );
        }

        if (body.amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than 0' },
                { status: 400 }
            );
        }

        const transfer = await fundSourceService.createTransfer({
            fromFundSourceId: body.fromFundSourceId,
            toFundSourceId: body.toFundSourceId,
            amount: body.amount,
            transferFee: body.transferFee || 0,
            description: body.description,
            transferDate: body.transferDate ? new Date(body.transferDate) : undefined,
            createdById: userId,
        });

        return NextResponse.json(transfer, { status: 201 });
    } catch (error) {
        console.error('Error creating fund transfer:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create fund transfer' },
            { status: 400 }
        );
    }
}
