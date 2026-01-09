import { NextRequest, NextResponse } from 'next/server';
import { proposalService } from '@/services/proposal.service';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status') || undefined;
        const category = searchParams.get('category') || undefined;

        const proposals = await proposalService.getProposals({ status, category });
        return NextResponse.json(proposals);
    } catch (error: any) {
        console.error('Error fetching proposals:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const proposal = await proposalService.createProposal(body);

        return NextResponse.json(proposal, { status: 201 });
    } catch (error: any) {
        console.error('Error creating proposal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
