import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = session.user.email;

        // Find member by email
        const member = await prisma.cooperativeMember.findUnique({
            where: { email },
            include: {
                MembershipType: true,
                Wallet: true,
                EngagementScore: true
            }
        });

        if (!member) {
            return NextResponse.json({ error: 'Member profile not found for this user' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: member
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
