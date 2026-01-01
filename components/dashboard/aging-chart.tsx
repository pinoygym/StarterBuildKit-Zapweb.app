'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgingData } from '@/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils';
import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AgingChartProps {
    branchId?: string;
}

export function AgingChart({ branchId }: AgingChartProps) {
    const { data: aging, isLoading } = useAgingData(branchId);

    const renderAgingSection = (title: string, buckets: any[], type: 'ar' | 'ap') => {
        const total = buckets.reduce((sum, b) => sum + Number(b.amount), 0);
        const colors = {
            '0-30': 'bg-blue-400',
            '31-60': 'bg-yellow-400',
            '61-90': 'bg-orange-400',
            '90+': 'bg-red-500',
        };

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
                    <span className="text-sm font-bold">{formatCurrency(total)}</span>
                </div>
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-secondary">
                    {buckets.map((b) => (
                        <div
                            key={b.bucket}
                            className={`${colors[b.bucket as keyof typeof colors]} h-full transition-all`}
                            style={{ width: total > 0 ? `${(Number(b.amount) / total) * 100}%` : '0%' }}
                            title={`${b.bucket}: ${formatCurrency(Number(b.amount))}`}
                        />
                    ))}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {buckets.map((b) => (
                        <div key={b.bucket} className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${colors[b.bucket as keyof typeof colors]}`} />
                                <span className="text-[10px] font-medium text-muted-foreground">{b.bucket} days</span>
                            </div>
                            <span className="text-xs font-semibold mt-0.5">{formatCurrency(Number(b.amount))}</span>
                            <span className="text-[9px] text-muted-foreground">{b.count} items</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Card className="col-span-1 md:col-span-8">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <History className="w-5 h-5" />
                    AR & AP Aging
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                {isLoading ? (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </div>
                ) : (
                    <>
                        {aging && renderAgingSection('Accounts Receivable Aging', aging.receivables, 'ar')}
                        {aging && renderAgingSection('Accounts Payable Aging', aging.payables, 'ap')}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
