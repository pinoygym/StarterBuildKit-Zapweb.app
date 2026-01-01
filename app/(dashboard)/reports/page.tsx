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
  usePOSReceipt,
  useDailySalesSummary,
  useEmployeePerformance,
  useCustomerPurchaseHistory,
  usePromotionUsage
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
        </TabsContent>

        {/* Sales Reports */}
        <TabsContent value="sales" className="space-y-4">
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
        </TabsContent>

        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-4">
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
