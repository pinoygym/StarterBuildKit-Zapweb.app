'use client';

import { Suspense } from 'react';
import { NewAdjustmentContent } from './content';

// Prevent static generation at build time
export const dynamic = 'force-dynamic';

export default function NewAdjustmentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewAdjustmentContent />
        </Suspense>
    );
}
