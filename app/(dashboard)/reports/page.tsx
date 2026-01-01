'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBranch } from '@/hooks/use-branch';
import { 
  useStockLevelReport, 
  useInventoryValueReport, 
  useSalesReport, 
  useBestSellers,
  useProfitLoss,
  useCashFlow,
  useBalanceSheet,
  useDailySalesSummary,
  useEmployeePerformance,
  useCustomerPurchaseHistory,
  usePromotionUsage,
  useReceivingVariance
} from '@/hooks/use-reports';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { BatchPrintManager } from '@/components/reports/batch-print-manager';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import { ReportTemplateManager } from '@/components/reports/report-template-manager';
import { exportData, prepareSalesDataForExport, prepareInventoryDataForExport, ExportFormat } from '@/lib/export-utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

export default function ReportsPage() {
  const { selectedBranch } = useBranch();
  const [dateRange, setDateRange] = useState({ 
    fromDate: new Date(new Date().setDate(1)), // First day of month
    toDate: new Date() 
  });

  const { data: stockLevels, loading: stockLoading } = useStockLevelReport({ 
    branchId: selectedBranch?.id 
  });
  const { data: inventoryValue, loading: invValueLoading } = useInventoryValueReport({ 
    branchId: selectedBranch?.id 
  });
  const { data: salesData, loading: salesLoading } = useSalesReport({ 
    branchId: selectedBranch?.id,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate
  });
  const { data: bestSellers, loading: bestLoading } = useBestSellers({ 
    branchId: selectedBranch?.id,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate
  }, 10);
  const { data: profitLoss, loading: plLoading } = useProfitLoss({ 
    branchId: selectedBranch?.id,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate
  });

  const { data: promotionData, loading: promotionLoading } = usePromotionUsage({
    branchId: selectedBranch?.id,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate
  });

  const { data: balanceSheet, loading: bsLoading } = useBalanceSheet({
    branchId: selectedBranch?.id,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate
  });
  const { data: cashFlow, loading: cfLoading } = useCashFlow({
    branchId: selectedBranch?.id,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate
  });
  const { data: dailySummary, loading: dailyLoading } = useDailySalesSummary({
    branchId: selectedBranch?.id,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate
  });
  const { data: employeePerf, loading: empLoading } = useEmployeePerformance({
    branchId: selectedBranch?.id,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate
  });
  const { data: customerHistory, loading: custLoading } = useCustomerPurchaseHistory(undefined, {
    branchId: selectedBranch?.id,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate
  });
  const { data: receivingVariance, loading: rvLoading } = useReceivingVariance({
    branchId: selectedBranch?.id,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate
  });

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'adequate':
        return <Badge variant="default">Adequate</Badge>;
      case 'low':
        return <Badge variant="warning">Low Stock</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return null;
    }
  };

  const handleExport = (
    reportName: string,
    format: ExportFormat,
    rawData: any[],
    typeKey: string
  ) => {
    if (!rawData || rawData.length === 0) {
      toast.error('No data to export');
      return;
    }

    let tableData;
    switch (typeKey) {
      case 'sales':
        tableData = prepareSalesDataForExport(rawData);
        break;
      case 'stock-levels':
        tableData = prepareInventoryDataForExport(rawData);
        break;
      case 'best-sellers':
        tableData = {
          headers: ['Rank', 'Product', 'Category', 'Qty Sold', 'Revenue', 'Profit'],
          data: rawData.map((item, index) => [
            `#${index + 1}`,
            item.productName,
            item.category,
            item.quantitySold,
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.revenue)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.profit))
          ])
        };
        break;
      case 'inventory-value':
        tableData = {
          headers: ['Product', 'Quantity', 'Avg Cost', 'Total Value'],
          data: rawData.map((item) => [
            item.productName,
            item.totalQuantity,
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.averageCost)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.totalValue))
          ])
        };
        break;
      case 'daily-sales-summary':
        tableData = {
          headers: ['Date', 'Transactions', 'Total Sales', 'Avg Transaction', 'Cash', 'Card', 'Digital', 'Credit'],
          data: rawData.map((item) => [
            new Date(item.date).toLocaleDateString(),
            item.totalTransactions,
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.totalSales)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.averageTransaction)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.cashSales)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.cardSales)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.digitalSales)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.creditSales))
          ])
        };
        break;
      case 'employee-performance':
        tableData = {
          headers: ['Employee', 'Date', 'Sales', 'Transactions', 'Avg Transaction', 'Items Sold'],
          data: rawData.map((item) => [
            item.employeeName,
            new Date(item.date).toLocaleDateString(),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.totalSales)),
            item.transactionCount,
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.averageTransaction)),
            item.itemsSold
          ])
        };
        break;
      case 'customer-purchase-history':
        tableData = {
          headers: ['Customer', 'Receipt', 'Date', 'Items', 'Amount', 'Payment'],
          data: rawData.map((item) => [
            item.customerName,
            item.receiptNumber,
            new Date(item.purchaseDate).toLocaleDateString(),
            item.itemsCount,
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.totalAmount)),
            item.paymentMethod
          ])
        };
        break;
      case 'receiving-variance':
        tableData = {
          headers: ['Supplier', 'POs', 'Avg Var %', 'Over', 'Under', 'Exact'],
          data: rawData.map((row) => [
            row.supplierName,
            row.totalPOs,
            `${Number(row.averageVariancePercentage).toFixed(2)}%`,
            row.overDeliveryCount,
            row.underDeliveryCount,
            row.exactMatchCount
          ])
        };
        break;
      case 'balance-sheet':
        tableData = {
          headers: ['Inventory Value', 'Accounts Receivable', 'Total Assets', 'Accounts Payable', 'Total Liabilities', 'Equity'],
          data: rawData.map((bs) => [
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(bs.assets.inventoryValue)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(bs.assets.accountsReceivable)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(bs.assets.total)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(bs.liabilities.accountsPayable)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(bs.liabilities.total)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(bs.equity))
          ])
        };
        break;
      case 'cash-flow':
        tableData = {
          headers: ['POS Sales', 'AR Payments', 'Total Inflows', 'Expenses', 'AP Payments', 'Total Outflows', 'Net Cash Flow'],
          data: rawData.map((cf) => [
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(cf.cashInflows.posSales)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(cf.cashInflows.arPayments)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(cf.cashInflows.total)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(cf.cashOutflows.expenses)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(cf.cashOutflows.apPayments)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(cf.cashOutflows.total)),
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(cf.netCashFlow))
          ])
        };
        break;
      case 'promotion-usage':
        tableData = {
          headers: ['Date', 'Promotion', 'Code', 'Customer', 'Discount', 'Branch', 'Receipt'],
          data: rawData.map((item) => [
            new Date(item.usageDate).toLocaleDateString(),
            item.promotionName,
            item.promotionCode || '',
            item.customerName || '',
            new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.discountAmount)),
            item.branchName,
            item.receiptNumber
          ])
        };
        break;
      default:
        tableData = {
          headers: Object.keys(rawData[0] || {}),
          data: rawData.map((row) => Object.values(row))
        };
    }

    exportData(tableData, {
      format,
      filename: reportName.toLowerCase().replace(/[\s&]+/g, '-'),
      title: reportName,
      dateRange: { start: dateRange.fromDate, end: dateRange.toDate },
      filters: { branchId: selectedBranch?.id, branchName: (selectedBranch as any)?.name }
    });
    toast.success(`Exported ${reportName}`);
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate comprehensive business reports"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
        ]}
      />

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="batch-print">Batch Print</TabsTrigger>
        </TabsList>

        {/* Inventory Reports */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Stock Levels Report */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Stock Level Report
              </CardTitle>
              <ExportDropdown 
                onExport={(format) => handleExport('Stock Level', format, stockLevels, 'stock-levels')}
                size="sm"
              />
            </CardHeader>
            <CardContent>
              {stockLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Min Level</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockLevels.map((item) => (
                      <TableRow key={`${item.productId}-${item.warehouseId}`}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                        <TableCell className="text-right">{item.currentStock} {item.baseUOM}</TableCell>
                        <TableCell className="text-right">{item.minStockLevel}</TableCell>
                        <TableCell>{getStockStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Inventory Value Report */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Inventory Valuation Report
              </CardTitle>
              <ExportDropdown 
                onExport={(format) => handleExport('Inventory Valuation', format, inventoryValue, 'inventory-value')}
                size="sm"
              />
            </CardHeader>
            <CardContent>
              {invValueLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Avg Cost</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryValue.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-right">{item.totalQuantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(item.averageCost))}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(Number(item.totalValue))}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={3} className="font-bold">Total Inventory Value</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(inventoryValue.reduce((sum, item) => sum + Number(item.totalValue), 0))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
          {/* Receiving Variance Report */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Receiving Variance Report
              </CardTitle>
              <ExportDropdown 
                onExport={(format) => handleExport('Receiving Variance', format, receivingVariance, 'receiving-variance')}
                size="sm"
              />
            </CardHeader>
            <CardContent>
              {rvLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : receivingVariance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">POs</TableHead>
                      <TableHead className="text-right">Avg Var %</TableHead>
                      <TableHead className="text-right">Over</TableHead>
                      <TableHead className="text-right">Under</TableHead>
                      <TableHead className="text-right">Exact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivingVariance.map((row) => (
                      <TableRow key={row.supplierId}>
                        <TableCell className="font-medium">{row.supplierName}</TableCell>
                        <TableCell className="text-right">{row.totalPOs}</TableCell>
                        <TableCell className="text-right">{row.averageVariancePercentage.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{row.overDeliveryCount}</TableCell>
                        <TableCell className="text-right">{row.underDeliveryCount}</TableCell>
                        <TableCell className="text-right">{row.exactMatchCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No variance data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Reports */}
        <TabsContent value="sales" className="space-y-4">
          {/* Daily Sales Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Daily Sales Summary
              </CardTitle>
              <ExportDropdown 
                onExport={(format) => handleExport('Daily Sales Summary', format, dailySummary, 'daily-sales-summary')}
                size="sm"
              />
            </CardHeader>
            <CardContent>
              {dailyLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-right">Avg Transaction</TableHead>
                      <TableHead className="text-right">Cash</TableHead>
                      <TableHead className="text-right">Card</TableHead>
                      <TableHead className="text-right">Digital</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySummary.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{item.totalTransactions}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.totalSales))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.averageTransaction))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.cashSales))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.cardSales))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.digitalSales))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.creditSales))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          {/* Best Sellers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Top 10 Best Selling Products
              </CardTitle>
              <ExportDropdown 
                onExport={(format) => handleExport('Best Sellers', format, bestSellers, 'best-sellers')}
                size="sm"
              />
            </CardHeader>
            <CardContent>
              {bestLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bestSellers.map((item, index) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-bold">#{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">{item.quantitySold}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.revenue))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.profit))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Sales Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sales Summary Report
              </CardTitle>
              <ExportDropdown 
                onExport={(format) => handleExport('Sales Summary', format, salesData, 'sales')}
                size="sm"
              />
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">COGS</TableHead>
                      <TableHead className="text-right">Gross Profit</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{item.transactionCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.totalRevenue))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.totalCOGS))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.grossProfit))}</TableCell>
                        <TableCell className="text-right">{item.grossMargin.toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          {/* Employee Performance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Employee Performance
              </CardTitle>
              <ExportDropdown 
                onExport={(format) => handleExport('Employee Performance', format, employeePerf, 'employee-performance')}
                size="sm"
              />
            </CardHeader>
            <CardContent>
              {empLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Avg Transaction</TableHead>
                      <TableHead className="text-right">Items Sold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeePerf.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.employeeName}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.totalSales))}</TableCell>
                        <TableCell className="text-right">{item.transactionCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.averageTransaction))}</TableCell>
                        <TableCell className="text-right">{item.itemsSold}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Customer Purchase History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Customer Purchase History
              </CardTitle>
              <ExportDropdown 
                onExport={(format) => handleExport('Customer Purchase History', format, customerHistory, 'customer-purchase-history')}
                size="sm"
              />
            </CardHeader>
            <CardContent>
              {custLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.customerName}</TableCell>
                        <TableCell><Badge variant="outline">{item.receiptNumber}</Badge></TableCell>
                        <TableCell>{new Date(item.purchaseDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{item.itemsCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.totalAmount))}</TableCell>
                        <TableCell>{item.paymentMethod}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-4">
          {/* Balance Sheet */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Balance Sheet
              </CardTitle>
              <ExportDropdown 
                onExport={(format) => handleExport('Balance Sheet', format, balanceSheet ? [balanceSheet] : [], 'balance-sheet')}
                size="sm"
              />
            </CardHeader>
            <CardContent>
              {bsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : balanceSheet ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Assets</p>
                    <div className="space-y-1">
                      <p>Inventory Value: <span className="font-semibold">{formatCurrency(Number(balanceSheet.assets.inventoryValue))}</span></p>
                      <p>Accounts Receivable: <span className="font-semibold">{formatCurrency(Number(balanceSheet.assets.accountsReceivable))}</span></p>
                      <p className="pt-2 border-t">Total Assets: <span className="font-bold">{formatCurrency(Number(balanceSheet.assets.total))}</span></p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Liabilities</p>
                    <div className="space-y-1">
                      <p>Accounts Payable: <span className="font-semibold">{formatCurrency(Number(balanceSheet.liabilities.accountsPayable))}</span></p>
                      <p className="pt-2 border-t">Total Liabilities: <span className="font-bold">{formatCurrency(Number(balanceSheet.liabilities.total))}</span></p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Equity</p>
                    <p className="text-2xl font-bold">{formatCurrency(Number(balanceSheet.equity))}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Profit & Loss Statement
              </CardTitle>
              <ExportDropdown 
                onExport={(format) => handleExport('Profit & Loss', format, profitLoss ? [profitLoss] : [], 'profit-loss')}
                size="sm"
              />
            </CardHeader>
            <CardContent>
              {plLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : profitLoss ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(Number(profitLoss.revenue))}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cost of Goods Sold</p>
                      <p className="text-2xl font-bold text-red-600">-{formatCurrency(Number(profitLoss.cogs))}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Profit</p>
                      <p className="text-2xl font-bold">{formatCurrency(Number(profitLoss.grossProfit))}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Operating Expenses</p>
                      <p className="text-2xl font-bold text-red-600">-{formatCurrency(Number(profitLoss.expenses))}</p>
                    </div>
                    <div className="col-span-2 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                      <p className={`text-3xl font-bold ${Number(profitLoss.netProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Number(profitLoss.netProfit))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Margin</p>
                      <p className="text-xl font-semibold">{profitLoss.grossMargin.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Margin</p>
                      <p className="text-xl font-semibold">{profitLoss.netMargin.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Cash Flow */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cash Flow Statement
              </CardTitle>
              <ExportDropdown 
                onExport={(format) => handleExport('Cash Flow', format, cashFlow ? [cashFlow] : [], 'cash-flow')}
                size="sm"
              />
            </CardHeader>
            <CardContent>
              {cfLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : cashFlow ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cash Inflows</p>
                    <div className="space-y-1">
                      <p>POS Sales: <span className="font-semibold">{formatCurrency(Number(cashFlow.cashInflows.posSales))}</span></p>
                      <p>AR Payments: <span className="font-semibold">{formatCurrency(Number(cashFlow.cashInflows.arPayments))}</span></p>
                      <p className="pt-2 border-t">Total Inflows: <span className="font-bold">{formatCurrency(Number(cashFlow.cashInflows.total))}</span></p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cash Outflows</p>
                    <div className="space-y-1">
                      <p>Expenses: <span className="font-semibold">{formatCurrency(Number(cashFlow.cashOutflows.expenses))}</span></p>
                      <p>AP Payments: <span className="font-semibold">{formatCurrency(Number(cashFlow.cashOutflows.apPayments))}</span></p>
                      <p className="pt-2 border-t">Total Outflows: <span className="font-bold">{formatCurrency(Number(cashFlow.cashOutflows.total))}</span></p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                    <p className={`text-2xl font-bold ${Number(cashFlow.netCashFlow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(Number(cashFlow.netCashFlow))}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Reports */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Discount & Promotion Analytics
              </CardTitle>
              <ExportDropdown 
                onExport={(format) => handleExport('Discount & Promotion Analytics', format, promotionData || [], 'promotion-usage')}
                size="sm"
              />
            </CardHeader>
            <CardContent>
              {promotionLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : promotionData && promotionData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Promotion</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotionData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.usageDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{item.promotionName}</TableCell>
                        <TableCell>{item.promotionCode || ''}</TableCell>
                        <TableCell>{item.customerName || ''}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.discountAmount))}</TableCell>
                        <TableCell>{item.branchName}</TableCell>
                        <TableCell><Badge variant="outline">{item.receiptNumber}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No promotion usage data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <ReportTemplateManager />
        </TabsContent>

        {/* Batch Print */}
        <TabsContent value="batch-print" className="space-y-4">
          <BatchPrintManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
