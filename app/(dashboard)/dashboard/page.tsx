'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBranch } from '@/hooks/use-branch';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardKPIs } from '@/types/dashboard.types';
import { Package, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

export default function DashboardPage() {
  const { selectedBranch } = useBranch();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedBranch?.id) params.append('branchId', selectedBranch.id);
        
        const response = await fetch(`/api/dashboard/kpis?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setKpis(data.data);
        }
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [selectedBranch?.id]);

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        description="Welcome to InventoryPro - Your comprehensive inventory management system"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground">Active products</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis?.totalStock.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Units in inventory</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(Number(kpis?.inventoryValue || 0))}</div>
                <p className="text-xs text-muted-foreground">Total value</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(Number(kpis?.todaySalesRevenue || 0))}</div>
                <p className="text-xs text-muted-foreground">{kpis?.todaySalesCount || 0} transactions</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding AR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(Number(kpis?.outstandingAR || 0))}</div>
                <p className="text-xs text-muted-foreground">{kpis?.overdueReceivables || 0} overdue</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding AP</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(Number(kpis?.outstandingAP || 0))}</div>
                <p className="text-xs text-muted-foreground">{kpis?.overduePayables || 0} overdue</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Month Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(Number(kpis?.currentMonthExpenses || 0))}</div>
                <p className="text-xs text-muted-foreground">Current month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Sales Orders</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis?.activeSalesOrders || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {kpis?.salesOrderConversionRate.toFixed(1) || 0}% conversion rate
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
