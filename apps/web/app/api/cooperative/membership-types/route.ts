import { NextRequest, NextResponse } from 'next/server';
import { membershipTypeService } from '@/services/membership-type.service';
import { getServerSession } from '@/lib/auth';
import { ValidationError } from '@/lib/errors';

// GET /api/cooperative/membership-types - List all membership types
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const activeOnly = searchParams.get('activeOnly') === 'true';

        const types = activeOnly
            ? await membershipTypeService.getActiveTypes()
            : await membershipTypeService.getAllTypes();

        return NextResponse.json({ data: types });
    } catch (error: any) {
        console.error('Error fetching membership types:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch membership types' },
            { status: error.statusCode || 500 }
        );
    }
}

// POST /api/cooperative/membership-types - Create new membership type
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const type = await membershipTypeService.createType(
            body,
            session.user.id
        );

        return NextResponse.json(type, { status: 201 });
    } catch (error: any) {
        console.error('Error creating membership type:', error);

        if (error instanceof ValidationError) {
            return NextResponse.json(
                { error: error.message, details: error.details },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to create membership type' },
            { status: error.statusCode || 500 }
        );
    }
}
