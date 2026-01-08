import { NextRequest, NextResponse } from 'next/server';
import { membershipTypeService } from '@/services/membership-type.service';
import { getServerSession } from '@/lib/auth';
import { ValidationError, NotFoundError } from '@/lib/errors';

// GET /api/cooperative/membership-types/[id] - Get membership type details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const type = await membershipTypeService.getTypeById(params.id);

        return NextResponse.json(type);
    } catch (error: any) {
        console.error('Error fetching membership type:', error);

        if (error instanceof NotFoundError) {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to fetch membership type' },
            { status: error.statusCode || 500 }
        );
    }
}

// PATCH /api/cooperative/membership-types/[id] - Update membership type
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const type = await membershipTypeService.updateType(
            params.id,
            body,
            session.user.id
        );

        return NextResponse.json(type);
    } catch (error: any) {
        console.error('Error updating membership type:', error);

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
            { error: error.message || 'Failed to update membership type' },
            { status: error.statusCode || 500 }
        );
    }
}

// DELETE /api/cooperative/membership-types/[id] - Delete membership type
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await membershipTypeService.deleteType(params.id, session.user.id);

        return NextResponse.json({ message: 'Membership type deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting membership type:', error);

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
            { error: error.message || 'Failed to delete membership type' },
            { status: error.statusCode || 500 }
        );
    }
}
