import { NextRequest, NextResponse } from 'next/server';
import { proposalService } from '@/services/proposal.service';
import { getServerSession } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { memberId, voteType, comment } = body;

        if (!memberId || !voteType) {
            return NextResponse.json({ error: 'memberId and voteType are required' }, { status: 400 });
        }

        const result = await proposalService.voteOnProposal(id, memberId, voteType, comment);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error voting on proposal:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
