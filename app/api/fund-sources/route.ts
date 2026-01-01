import { NextRequest, NextResponse } from 'next/server';
import { fundSourceService } from '@/services/fund-source.service';
import { authService } from '@/services/auth.service';
import { FundSourceFilters } from '@/types/fund-source.types';
import { extractToken } from '@/lib/auth-utils';

// GET /api/fund-sources - List all fund sources
export async function GET(request: NextRequest) {
    try {
        // Authentication check
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
        const filters: FundSourceFilters = {
            branchId: searchParams.get('branchId') || undefined,
            type: searchParams.get('type') as FundSourceFilters['type'] || undefined,
            status: searchParams.get('status') as FundSourceFilters['status'] || undefined,
            search: searchParams.get('search') || undefined,
        };

        const fundSources = await fundSourceService.getAllFundSources(filters);
        return NextResponse.json(fundSources);
    } catch (error) {
        console.error('Error fetching fund sources:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch fund sources' },
            { status: 500 }
        );
    }
}

// POST /api/fund-sources - Create a new fund source
export async function POST(request: NextRequest) {
    try {
        // Extract userId from token
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
        console.log('[Fund Source API] Creating fund source with data:', JSON.stringify(body, null, 2));

        // Validate required fields
        if (!body.name || !body.code || !body.type) {
            console.error('[Fund Source API] Missing required fields:', { name: !!body.name, code: !!body.code, type: !!body.type });
            return NextResponse.json(
                { error: 'Name, code, and type are required' },
                { status: 400 }
            );
        }

        const fundSource = await fundSourceService.createFundSource(body, userId);
        console.log('[Fund Source API] Fund source created successfully:', fundSource.id);
        return NextResponse.json(fundSource, { status: 201 });
    } catch (error) {
        console.error('[Fund Source API] Error creating fund source:', error);
        console.error('[Fund Source API] Error details:', error instanceof Error ? error.stack : error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create fund source' },
            { status: 400 }
        );
    }
}
