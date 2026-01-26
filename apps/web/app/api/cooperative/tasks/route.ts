import { NextRequest, NextResponse } from 'next/server';
import { cooperativeTaskService } from '@/services/cooperative-task.service';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status') || undefined;
        const initiativeId = searchParams.get('initiativeId') || undefined;

        const tasks = await cooperativeTaskService.getTasks({ status, initiativeId });
        return NextResponse.json(tasks);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const task = await cooperativeTaskService.createTask(body);
        return NextResponse.json(task, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
