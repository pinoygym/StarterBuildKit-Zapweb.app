import { NextRequest, NextResponse } from 'next/server';
import { proposalService } from '@/services/proposal.service';
import { getServerSession } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const proposal = await proposalService.getProposalById(id);
        return NextResponse.json(proposal);
    } catch (error: any) {
        const { id } = await params;
        console.error('Error fetching proposal:', error);
        return NextResponse.json({ error: error.message }, { status: error.message === 'Proposal not found' ? 404 : 500 });
    }
}

export async function PATCH(
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
        if (body.status) {
            const result = await proposalService.updateProposalStatus(id, body.status);
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    } catch (error: any) {
        console.error('Error updating proposal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await proposalService.deleteProposal(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting proposal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
