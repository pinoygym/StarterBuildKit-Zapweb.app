'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingDown, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface APAgingBucket {
  bucket: string;
  count: number;
  totalAmount: string;
}

interface APAgingReport {
  buckets: APAgingBucket[];
  totalOutstanding: string;
  bySupplier: Array<{
    supplierName: string;
    total: string;
    oldestInvoiceDays: number;
  }>;
}

interface APAgingReportProps {
  branchId?: string;
}

export function APAgingReport({ branchId }: APAgingReportProps) {
  const [report, setReport] = useState<APAgingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgingReport();
  }, [branchId]);

  const fetchAgingReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);

      const response = await fetch(`/api/ap/aging-report?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setReport(data.data);
      } else {
        setError(data.error || 'Failed to load aging report');
      }
    } catch (err) {
      setError('Failed to load aging report');
      console.error('Error fetching AP aging report:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case '0-30':
        return 'text-green-600 dark:text-green-400';
      case '31-60':
        return 'text-yellow-600 dark:text-yellow-400';
      case '61-90':
        return 'text-orange-600 dark:text-orange-400';
      case '90+':
        return 'text-red-600 dark:text-red-400';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {report.buckets.map((bucket) => (
          <Card key={bucket.bucket}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{bucket.bucket} Days</CardTitle>
              <TrendingDown className={`h-4 w-4 ${getBucketColor(bucket.bucket)}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getBucketColor(bucket.bucket)}`}>
                {formatCurrency(bucket.totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {bucket.count} {bucket.count === 1 ? 'bill' : 'bills'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Outstanding Card */}
      <Card className="border-2 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Total Outstanding Payables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-destructive">
            {formatCurrency(report.totalOutstanding)}
          </div>
        </CardContent>
      </Card>

      {/* By Supplier Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Payables by Supplier
          </CardTitle>
          <CardDescription>
            Breakdown of outstanding amounts by supplier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.bySupplier.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No outstanding payables
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Outstanding Amount</TableHead>
                  <TableHead className="text-right">Oldest Bill (Days)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.bySupplier.map((supplier, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{supplier.supplierName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(supplier.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          supplier.oldestInvoiceDays <= 30
                            ? 'text-green-600 dark:text-green-400'
                            : supplier.oldestInvoiceDays <= 60
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : supplier.oldestInvoiceDays <= 90
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {supplier.oldestInvoiceDays} days
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
