import { NextRequest, NextResponse } from 'next/server';
import { cooperativeMemberService } from '@/services/cooperative-member.service';
import { getServerSession } from '@/lib/auth';
import { ValidationError, NotFoundError } from '@/lib/errors';

// GET /api/cooperative/members/[id] - Get member details
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

        const member = await cooperativeMemberService.getMemberById(id);

        return NextResponse.json(member);
    } catch (error: any) {
        const { id } = await params;
        console.error(`Error fetching cooperative member [${id}]:`, error);

        if (error instanceof NotFoundError) {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to fetch member' },
            { status: error.statusCode || 500 }
        );
    }
}

// PATCH /api/cooperative/members/[id] - Update member
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

        const member = await cooperativeMemberService.updateMember(
            id,
            body,
            session.user.id
        );

        return NextResponse.json(member);
    } catch (error: any) {
        console.error('Error updating cooperative member:', error);

        if (error instanceof ValidationError) {
            return NextResponse.json(
                { error: error.message, details: error.details },
                { status: 400 }
            );
        }

        if (error instanceof NotFoundError) {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to update member' },
            { status: error.statusCode || 500 }
        );
    }
}

// DELETE /api/cooperative/members/[id] - Deactivate member (soft delete)
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

        await cooperativeMemberService.deleteMember(id, session.user.id);

        return NextResponse.json({ message: 'Member deactivated successfully' });
    } catch (error: any) {
        console.error('Error deleting cooperative member:', error);

        if (error instanceof ValidationError) {
            return NextResponse.json(
                { error: error.message, details: error.details },
                { status: 400 }
            );
        }

        if (error instanceof NotFoundError) {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to delete member' },
            { status: error.statusCode || 500 }
        );
    }
}
