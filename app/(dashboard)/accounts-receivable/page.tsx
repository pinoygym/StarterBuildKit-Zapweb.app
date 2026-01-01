import { Suspense } from 'react';
import { arService } from '@/services/ar.service';
import { fundSourceService } from '@/services/fund-source.service';
import { ARAgingSummary } from '@/components/ar/ar-aging-summary';
import { ARTable } from '@/components/ar/ar-table';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';

export default async function AccountsReceivablePage() {
    // Fetch data in parallel
    const [arRecords, agingReport, fundSources] = await Promise.all([
        arService.getAllAR({}),
        arService.getAgingReport(),
        fundSourceService.getAllFundSources({ status: 'active' }),
    ]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Accounts Receivable</h2>
            </div>

            <Separator />

            <div className="space-y-4">
                <Suspense fallback={<div>Loading stats...</div>}>
                    <ARAgingSummary report={agingReport} />
                </Suspense>

                <Suspense fallback={<div>Loading table...</div>}>
                    <ARTable
                        data={arRecords}
                        fundSources={fundSources}
                    />
                </Suspense>
            </div>
        </div>
    );
}
