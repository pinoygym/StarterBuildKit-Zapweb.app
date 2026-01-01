'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSalesOrderSummary } from '@/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils';
import { ClipboardList } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderPipelineProps {
    branchId?: string;
}

export function OrderPipeline({ branchId }: OrderPipelineProps) {
    const { data: summary, isLoading } = useSalesOrderSummary(branchId);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-500';
            case 'pending': return 'bg-yellow-500';
            case 'processing': return 'bg-blue-500';
            case 'cancelled': return 'bg-red-500';
            case 'draft': return 'bg-gray-500';
            default: return 'bg-slate-500';
        }
    };

    const totalOrders = summary?.reduce((sum, s) => sum + s.count, 0) || 0;

    return (
        <Card className="col-span-1 md:col-span-4">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Sales Order Pipeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-[80%]" />
                        <Skeleton className="h-4 w-[60%]" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {!summary || summary.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">No sales orders found.</p>
                        ) : (
                            <>
                                <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
                                    {summary.map((s) => (
                                        <div
                                            key={s.status}
                                            className={`${getStatusColor(s.status)} h-full transition-all`}
                                            style={{ width: `${(s.count / totalOrders) * 100}%` }}
                                            title={`${s.status}: ${s.count} orders`}
                                        />
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {summary.map((s) => (
                                        <div key={s.status} className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${getStatusColor(s.status)}`} />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium capitalize">{s.status}</span>
                                                    <span className="text-xs text-muted-foreground">{s.count}</span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {formatCurrency(Number(s.totalAmount))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
