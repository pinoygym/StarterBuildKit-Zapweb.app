'use client';

import { Suspense } from 'react';
import { NewPurchaseOrderContent } from './content';

// Prevent static generation at build time
export const dynamic = 'force-dynamic';

export default function NewPurchaseOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewPurchaseOrderContent />
    </Suspense>
  );
}
