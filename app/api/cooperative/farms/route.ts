import { NextRequest, NextResponse } from 'next/server';
import { cooperativeFarmService } from '@/services/cooperative-farm.service';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const memberId = searchParams.get('memberId') || undefined;

        const farms = await cooperativeFarmService.getFarms(memberId);
        return NextResponse.json(farms);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const farm = await cooperativeFarmService.registerFarm(body);
        return NextResponse.json(farm, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
