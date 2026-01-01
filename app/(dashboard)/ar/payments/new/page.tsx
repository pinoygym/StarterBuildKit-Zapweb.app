'use client';

import { Suspense } from 'react';
import { NewBatchPaymentContent } from './content';

export const dynamic = 'force-dynamic';

export default function NewBatchPaymentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewBatchPaymentContent />
        </Suspense>
    );
}
