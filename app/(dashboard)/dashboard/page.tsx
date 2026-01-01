'use client';

import { PageHeader } from '@/components/shared/page-header';
import { useBranch } from '@/hooks/use-branch';
import { useDashboardKPIs } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import dynamic from 'next/dynamic';
import { LowStockAlerts } from '@/components/dashboard/low-stock-alerts';
import { KPICard } from '@/components/dashboard/kpi-card';

const SalesTrendsChart = dynamic(() => import('@/components/dashboard/sales-trends-chart').then(mod => mod.SalesTrendsChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full" />
});
const TopProductsChart = dynamic(() => import('@/components/dashboard/top-products-chart').then(mod => mod.TopProductsChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full" />
});
const BranchComparisonChart = dynamic(() => import('@/components/dashboard/branch-comparison-chart').then(mod => mod.BranchComparisonChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full" />
});
const WarehouseUtilizationChart = dynamic(() => import('@/components/dashboard/warehouse-utilization-chart').then(mod => mod.WarehouseUtilizationChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full" />
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

export default function DashboardPage() {
  const { selectedBranch } = useBranch();
  const { data: kpis, isLoading: loading } = useDashboardKPIs(selectedBranch?.id);

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        description="Welcome to Softdrinks Distributions Corporation - Business Management System. powered by www.zapweb.app"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <KPICard
          title="Total Products"
          value={kpis?.totalProducts || 0}
          subtitle="Active products"
          icon={Package}
          loading={loading}
        />

        <KPICard
          title="Total Stock"
          value={kpis?.totalStock.toLocaleString() || 0}
          subtitle="Units in inventory"
          icon={TrendingUp}
          loading={loading}
        />

        <KPICard
          title="Inventory Value"
          value={formatCurrency(Number(kpis?.inventoryValue || 0))}
          subtitle="Total value"
          icon={DollarSign}
          loading={loading}
        />

        <KPICard
          title="Today's Sales"
          value={formatCurrency(Number(kpis?.todaySalesRevenue || 0))}
          subtitle={`${kpis?.todaySalesCount || 0} transactions`}
          icon={DollarSign}
          loading={loading}
        />

        <KPICard
          title="Outstanding AR"
          value={formatCurrency(Number(kpis?.outstandingAR || 0))}
          subtitle={`${kpis?.overdueReceivables || 0} overdue`}
          icon={DollarSign}
          loading={loading}
        />

        <KPICard
          title="Outstanding AP"
          value={formatCurrency(Number(kpis?.outstandingAP || 0))}
          subtitle={`${kpis?.overduePayables || 0} overdue`}
          icon={DollarSign}
          loading={loading}
        />

        <KPICard
          title="Month Expenses"
          value={formatCurrency(Number(kpis?.currentMonthExpenses || 0))}
          subtitle="Current month"
          icon={DollarSign}
          loading={loading}
        />

        <KPICard
          title="Active Sales Orders"
          value={kpis?.activeSalesOrders || 0}
          subtitle={`${kpis?.salesOrderConversionRate.toFixed(1) || 0}% conversion rate`}
          icon={AlertCircle}
          loading={loading}
        />
      </div>

      {/* Charts and Visualizations */}
      <div className="grid gap-4 md:grid-cols-8 mt-6">
        <SalesTrendsChart branchId={selectedBranch?.id} days={7} />
        <TopProductsChart branchId={selectedBranch?.id} limit={5} />
      </div>

      <div className="grid gap-4 md:grid-cols-8 mt-6">
        <LowStockAlerts branchId={selectedBranch?.id} limit={10} />
      </div>

      {/* Branch Comparison and Warehouse Utilization */}
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <BranchComparisonChart />
        <WarehouseUtilizationChart branchId={selectedBranch?.id} />
      </div>
    </div>
  );
}
