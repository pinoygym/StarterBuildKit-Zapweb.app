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
  useProfitLoss 
} from '@/hooks/use-reports';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

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

  const handleExport = (reportName: string) => {
    // TODO: Implement actual export functionality
    toast.success(`Exporting ${reportName} report...`);
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
              <Button variant="outline" size="sm" onClick={() => handleExport('Stock Level')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
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
              <Button variant="outline" size="sm" onClick={() => handleExport('Inventory Valuation')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
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
              <Button variant="outline" size="sm" onClick={() => handleExport('Best Sellers')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
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
              <Button variant="outline" size="sm" onClick={() => handleExport('Sales Summary')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
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
              <Button variant="outline" size="sm" onClick={() => handleExport('Profit & Loss')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
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
      </Tabs>
    </div>
  );
}
