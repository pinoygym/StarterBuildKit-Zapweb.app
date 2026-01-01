import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ARAgingReport } from '@/types/ar.types';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Prisma } from '@prisma/client';

interface ARAgingSummaryProps {
    report: ARAgingReport | null; // Allow null during loading
    isLoading?: boolean;
}

export function ARAgingSummary({ report, isLoading }: ARAgingSummaryProps) {
    if (isLoading || !report) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-32 bg-gray-200 rounded mb-1" />
                            <div className="h-3 w-16 bg-gray-200 rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Helper to safely get total amount from bucket
    const getBucketAmount = (bucketLabel: string) => {
        const bucket = report.buckets.find(b => b.bucket === bucketLabel);
        // Handle Prisma Decimal or number
        const val = bucket?.totalAmount;
        return val ? Number(val) : 0;
    };

    const getBucketCount = (bucketLabel: string) => {
        return report.buckets.find(b => b.bucket === bucketLabel)?.count || 0;
    };

    const totalOutstanding = Number(report.totalOutstanding);
    const currentAmount = getBucketAmount('0-30');
    const days30Amount = getBucketAmount('31-60');
    const days60Amount = getBucketAmount('61-90');
    const days90Amount = getBucketAmount('90+');

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
                    <p className="text-xs text-muted-foreground">
                        Across all customers
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current (0-30 Days)</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(currentAmount)}</div>
                    <p className="text-xs text-muted-foreground">
                        {getBucketCount('0-30')} invoices
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue (31-90 Days)</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(days30Amount + days60Amount)}</div>
                    <p className="text-xs text-muted-foreground">
                        {getBucketCount('31-60') + getBucketCount('61-90')} invoices
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical (90+ Days)</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(days90Amount)}</div>
                    <p className="text-xs text-muted-foreground">
                        {getBucketCount('90+')} invoices
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
