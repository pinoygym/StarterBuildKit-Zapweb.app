import { NextRequest, NextResponse } from 'next/server';
import { memberWalletService } from '@/services/member-wallet.service';
import { getServerSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const tx = await memberWalletService.processTransaction(body);
        return NextResponse.json(tx, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
