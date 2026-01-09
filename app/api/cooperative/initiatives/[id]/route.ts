import { NextRequest, NextResponse } from 'next/server';
import { initiativeService } from '@/services/initiative.service';
import { getServerSession } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const initiative = await initiativeService.getInitiativeById(params.id);
        return NextResponse.json(initiative);
    } catch (error: any) {
        console.error('Error fetching initiative:', error);
        return NextResponse.json({ error: error.message }, { status: error.message === 'Initiative not found' ? 404 : 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const initiative = await initiativeService.updateInitiative(params.id, body);
        return NextResponse.json(initiative);
    } catch (error: any) {
        console.error('Error updating initiative:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await initiativeService.deleteInitiative(params.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting initiative:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
