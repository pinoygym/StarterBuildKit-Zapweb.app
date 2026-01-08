import { NextRequest, NextResponse } from 'next/server';
import { cooperativeMemberService } from '@/services/cooperative-member.service';
import { getServerSession } from '@/lib/auth';
import { NotFoundError } from '@/lib/errors';

// GET /api/cooperative/members/[id]/stats - Get member statistics
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stats = await cooperativeMemberService.getMemberStats(params.id);

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('Error fetching member statistics:', error);

        if (error instanceof NotFoundError) {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to fetch member statistics' },
            { status: error.statusCode || 500 }
        );
    }
}
