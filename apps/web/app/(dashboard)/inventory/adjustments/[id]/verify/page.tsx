'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { AdjustmentVerificationView } from '@/components/inventory/adjustment-verification-view';
// Reuse existing hook
import { useInventoryAdjustment } from '@/hooks/use-inventory-adjustments';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdjustmentVerificationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const { data: adjustment, isLoading } = useInventoryAdjustment(id);

    if (isLoading) {
        return <div className="p-6">Loading verification view...</div>;
    }

    if (!adjustment) {
        return <div className="p-6">Adjustment not found</div>;
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
            <div className="px-6 py-4 border-b shrink-0 bg-card">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                Verify Adjustment
                                <span className="font-mono text-muted-foreground font-normal text-lg">{adjustment.adjustmentNumber}</span>
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Badge variant="outline">{adjustment.Warehouse.name}</Badge>
                                <span>•</span>
                                <span>{adjustment.items.length} Items</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => router.back()}>
                            Exit Verification
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Complete Verification
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-6 bg-slate-50 dark:bg-slate-950/30">
                <AdjustmentVerificationView
                    adjustmentId={id}
                    initialItems={adjustment.items}
                />
            </div>
        </div>
    );
}
