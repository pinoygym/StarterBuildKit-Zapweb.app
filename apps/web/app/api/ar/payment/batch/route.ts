
import { NextRequest, NextResponse } from 'next/server';
import { arService } from '@/services/ar.service';
import { RecordBatchPaymentInput } from '@/types/ar.types';

export const dynamic = 'force-dynamic';

// POST /api/ar/payment/batch - Record batch payment for multiple ARs
export async function POST(request: NextRequest) {
    try {
        const body: RecordBatchPaymentInput = await request.json();

        // Basic validation
        if (!body.customerId || !body.totalAmount || !body.allocations.length) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await arService.recordBatchPayment(body);

        return NextResponse.json(
            { success: true, message: 'Batch payment recorded successfully' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error recording batch payment:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to record batch payment' },
            { status: 500 }
        );
    }
}
