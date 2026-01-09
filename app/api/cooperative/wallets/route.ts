import { NextRequest, NextResponse } from 'next/server';
import { memberWalletService } from '@/services/member-wallet.service';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const memberId = searchParams.get('memberId');
        const view = searchParams.get('view');

        if (view === 'stats') {
            const stats = await memberWalletService.getWalletStats();
            return NextResponse.json(stats);
        }

        if (memberId) {
            const wallet = await memberWalletService.getWallet(memberId);
            return NextResponse.json(wallet);
        }

        // List all (Admin view)
        const limit = parseInt(searchParams.get('limit') || '50');
        const wallets = await memberWalletService.getAllWallets(limit);
        return NextResponse.json(wallets);

    } catch (error: any) {
        console.error('Error in wallet GET route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
