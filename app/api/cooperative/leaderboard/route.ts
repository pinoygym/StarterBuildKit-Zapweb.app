import { NextRequest, NextResponse } from 'next/server';
import { leaderboardService } from '@/services/leaderboard.service';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '10');

        const contributors = await leaderboardService.getTopContributors(limit);
        return NextResponse.json(contributors);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
