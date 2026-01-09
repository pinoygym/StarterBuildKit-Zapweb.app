import { NextRequest, NextResponse } from 'next/server';
import { initiativeService } from '@/services/initiative.service';
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
        const search = searchParams.get('search') || undefined;

        const initiatives = await initiativeService.getInitiatives({ status, category, search });
        return NextResponse.json(initiatives);
    } catch (error: any) {
        console.error('Error fetching initiatives:', error);
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
        const initiative = await initiativeService.createInitiative({
            ...body,
            leadMemberId: body.leadMemberId // Ensure this is passed if available
        });

        return NextResponse.json(initiative, { status: 201 });
    } catch (error: any) {
        console.error('Error creating initiative:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
