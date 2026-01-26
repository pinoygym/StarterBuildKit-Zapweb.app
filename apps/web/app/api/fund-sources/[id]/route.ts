import { NextRequest, NextResponse } from 'next/server';
import { fundSourceService } from '@/services/fund-source.service';
import { authService } from '@/services/auth.service';
import { extractToken } from '@/lib/auth-utils';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// GET /api/fund-sources/[id] - Get fund source by ID
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
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

        const { id } = await context.params;
        const fundSource = await fundSourceService.getFundSourceById(id);
        return NextResponse.json(fundSource);
    } catch (error) {
        console.error('Error fetching fund source:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch fund source' },
            { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
        );
    }
}

// PUT /api/fund-sources/[id] - Update fund source
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
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

        const { id } = await context.params;
        const body = await request.json();

        const fundSource = await fundSourceService.updateFundSource(id, body);
        return NextResponse.json(fundSource);
    } catch (error) {
        console.error('Error updating fund source:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update fund source' },
            { status: error instanceof Error && error.message.includes('not found') ? 404 : 400 }
        );
    }
}

// DELETE /api/fund-sources/[id] - Delete/Close fund source
export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
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

        const { id } = await context.params;
        await fundSourceService.deleteFundSource(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting fund source:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete fund source' },
            { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
        );
    }
}
