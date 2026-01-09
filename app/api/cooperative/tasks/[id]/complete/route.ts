import { NextRequest, NextResponse } from 'next/server';
import { cooperativeTaskService } from '@/services/cooperative-task.service';
import { getServerSession } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { memberId } = body;

        if (!memberId) return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });

        const assignment = await cooperativeTaskService.completeTask(params.id, memberId);
        return NextResponse.json(assignment);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
