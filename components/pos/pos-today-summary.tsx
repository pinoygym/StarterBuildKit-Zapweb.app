'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { POSTodaySummary as POSTodaySummaryType } from '@/types/pos.types';
import { toast } from '@/hooks/use-toast';

interface POSTodaySummaryProps {
  branchId?: string;
}

export function POSTodaySummary({ branchId }: POSTodaySummaryProps) {
  const [summary, setSummary] = useState<POSTodaySummaryType>({
    transactionCount: 0,
    totalRevenue: 0,
    averageSaleValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [branchId]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const url = branchId
        ? `/api/pos/sales/today-summary?branchId=${branchId}`
        : '/api/pos/sales/today-summary';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setSummary(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch today summary',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching today summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch today summary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Transaction Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today&apos;s Transactions</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-8 bg-muted animate-pulse rounded" />
          ) : (
            <>
              <div className="text-2xl font-bold">{summary.transactionCount}</div>
              <p className="text-xs text-muted-foreground">
                Total sales today
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-8 bg-muted animate-pulse rounded" />
          ) : (
            <>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(summary.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total sales amount
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Average Sale Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-8 bg-muted animate-pulse rounded" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.averageSaleValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per transaction
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
