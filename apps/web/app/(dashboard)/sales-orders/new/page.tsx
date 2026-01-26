'use client';

import { Suspense } from 'react';
import { NewSalesOrderContent } from './content';

// Prevent static generation at build time
export const dynamic = 'force-dynamic';

export default function NewSalesOrderPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewSalesOrderContent />
        </Suspense>
    );
}
