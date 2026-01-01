'use client';

import { Suspense } from 'react';
import { NewTransferContent } from './content';

// Prevent static generation at build time
export const dynamic = 'force-dynamic';

export default function NewTransferPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewTransferContent />
        </Suspense>
    );
}
