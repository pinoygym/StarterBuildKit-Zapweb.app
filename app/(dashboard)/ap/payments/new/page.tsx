'use client';

import { Suspense } from 'react';
import { NewAPBatchPaymentContent } from './content';

export const dynamic = 'force-dynamic';

export default function NewAPBatchPaymentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewAPBatchPaymentContent />
        </Suspense>
    );
}
