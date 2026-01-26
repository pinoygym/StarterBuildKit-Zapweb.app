import { NextRequest, NextResponse } from 'next/server';
import { cooperativeMemberService } from '@/services/cooperative-member.service';
import { getServerSession } from '@/lib/auth';
import { ValidationError } from '@/lib/errors';

// GET /api/cooperative/members - List all members with filters
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status') as any;
        const membershipTypeId = searchParams.get('membershipTypeId') || undefined;
        const search = searchParams.get('search') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const skip = (page - 1) * limit;

        const filters = {
            status,
            membershipTypeId,
            search,
        };

        const [members, totalCount] = await Promise.all([
            cooperativeMemberService.getAllMembers(filters, { skip, limit }),
            cooperativeMemberService.getMemberCount(filters),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            data: members,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasMore: page < totalPages,
            },
        });
    } catch (error: any) {
        console.error('Error fetching cooperative members:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch members' },
            { status: error.statusCode || 500 }
        );
    }
}

// POST /api/cooperative/members - Register new member
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const member = await cooperativeMemberService.createMember(
            body,
            session.user.id
        );

        return NextResponse.json(member, { status: 201 });
    } catch (error: any) {
        console.error('Error creating cooperative member:', error);

        if (error instanceof ValidationError) {
            return NextResponse.json(
                { error: error.message, details: error.details },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to create member' },
            { status: error.statusCode || 500 }
        );
    }
}
