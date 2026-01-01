'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Printer, Calendar, TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailySalesSummary } from '@/types/report.types';
import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface DailySalesSummaryReportProps {
  data: DailySalesSummary[];
  loading: boolean;
  onExport?: () => void;
  companySettings?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    tin?: string;
    logo?: string;
  };
  dateRange: {
    start: Date;
    end: Date;
  };
  onPrintComplete?: () => void;
}

export function DailySalesSummaryReport({ 
  data, 
  loading, 
  onExport, 
  companySettings = {
    name: 'InventoryPro',
    address: 'Main Office',
    phone: '',
    email: '',
    tin: ''
  },
  dateRange,
  onPrintComplete
}: DailySalesSummaryReportProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Daily-Sales-Summary-${format(dateRange.start, 'yyyy-MM-dd')}`,
    onBeforePrint: () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      onPrintComplete?.();
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          margin: 0;
          padding: 10mm;
        }
        .no-print {
          display: none !important;
        }
      }
    `
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPerformanceBadge = (totalSales: number) => {
    if (totalSales > 50000) return <Badge variant="default">Excellent</Badge>;
    if (totalSales > 25000) return <Badge variant="secondary">Good</Badge>;
    if (totalSales > 10000) return <Badge variant="outline">Average</Badge>;
    return <Badge variant="destructive">Low</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daily Sales Summary
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSummary = data.reduce(
    (acc, day) => ({
      totalSales: acc.totalSales + day.totalSales,
      totalTransactions: acc.totalTransactions + day.totalTransactions,
      cashSales: acc.cashSales + day.cashSales,
      cardSales: acc.cardSales + day.cardSales,
      digitalSales: acc.digitalSales + day.digitalSales,
      creditSales: acc.creditSales + day.creditSales,
      totalTax: acc.totalTax + day.totalTax,
      totalDiscount: acc.totalDiscount + day.totalDiscount,
      grossProfit: acc.grossProfit + day.grossProfit,
    }),
    {
      totalSales: 0,
      totalTransactions: 0,
      cashSales: 0,
      cardSales: 0,
      digitalSales: 0,
      creditSales: 0,
      totalTax: 0,
      totalDiscount: 0,
      grossProfit: 0,
    }
  );

  const averageTransaction = totalSummary.totalTransactions > 0 
    ? totalSummary.totalSales / totalSummary.totalTransactions 
    : 0;

  return (
    <div ref={reportRef} className="space-y-4 bg-white text-black">
      {/* Header */}
      <div className="text-center mb-6">
        {companySettings.logo && (
          <div className="mb-4">
            <img src={companySettings.logo} alt={companySettings.name} className="h-20 mx-auto" />
          </div>
        )}
        <h1 className="text-2xl font-bold">{companySettings.name}</h1>
        {companySettings.address && (
          <p className="text-sm text-gray-600">{companySettings.address}</p>
        )}
        {companySettings.phone && (
          <p className="text-sm text-gray-600">Tel: {companySettings.phone}</p>
        )}
        {companySettings.tin && (
          <p className="text-sm text-gray-600">TIN: {companySettings.tin}</p>
        )}
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Daily Sales Summary Report</h2>
        <p className="text-sm text-gray-600">
          {format(dateRange.start, 'MMMM dd, yyyy')} {dateRange.start.getTime() !== dateRange.end.getTime() && `to ${format(dateRange.end, 'MMMM dd, yyyy')}`}
        </p>
      </div>

      <Separator className="my-4" />

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4 no-print">
        <Button 
          variant="outline" 
          onClick={handlePrint} 
          disabled={isPrinting}
        >
          <Printer className="h-4 w-4 mr-2" />
          {isPrinting ? 'Printing...' : 'Print Report'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onExport}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSummary.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              {totalSummary.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageTransaction)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSummary.grossProfit)}</div>
            <p className="text-xs text-muted-foreground">
              {totalSummary.totalSales > 0 ? ((totalSummary.grossProfit / totalSummary.totalSales) * 100).toFixed(1) : 0}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{formatCurrency(totalSummary.totalDiscount)}</div>
            <p className="text-xs text-muted-foreground">
              {totalSummary.totalSales > 0 ? ((totalSummary.totalDiscount / totalSummary.totalSales) * 100).toFixed(1) : 0}% of sales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daily Sales Summary
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total Sales</TableHead>
                <TableHead className="text-right">Cash</TableHead>
                <TableHead className="text-right">Card</TableHead>
                <TableHead className="text-right">Digital</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-center">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((day) => (
                <TableRow key={day.id}>
                  <TableCell className="font-medium">{formatDate(day.date)}</TableCell>
                  <TableCell className="text-right">{day.totalTransactions}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(day.totalSales)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(day.cashSales)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(day.cardSales)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(day.digitalSales)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(day.creditSales)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(day.totalTax)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(day.grossProfit)}</TableCell>
                  <TableCell className="text-center">
                    {getPerformanceBadge(day.totalSales)}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Totals Row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">{totalSummary.totalTransactions}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalSummary.totalSales)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalSummary.cashSales)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalSummary.cardSales)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalSummary.digitalSales)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalSummary.creditSales)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalSummary.totalTax)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalSummary.grossProfit)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="default">Overall</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Payment Method Summary */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-3">Payment Method Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Cash</div>
                <div className="font-semibold">{formatCurrency(totalSummary.cashSales)}</div>
                <div className="text-xs text-muted-foreground">
                  {totalSummary.totalSales > 0 ? ((totalSummary.cashSales / totalSummary.totalSales) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Card</div>
                <div className="font-semibold">{formatCurrency(totalSummary.cardSales)}</div>
                <div className="text-xs text-muted-foreground">
                  {totalSummary.totalSales > 0 ? ((totalSummary.cardSales / totalSummary.totalSales) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Digital</div>
                <div className="font-semibold">{formatCurrency(totalSummary.digitalSales)}</div>
                <div className="text-xs text-muted-foreground">
                  {totalSummary.totalSales > 0 ? ((totalSummary.digitalSales / totalSummary.totalSales) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Credit</div>
                <div className="font-semibold">{formatCurrency(totalSummary.creditSales)}</div>
                <div className="text-xs text-muted-foreground">
                  {totalSummary.totalSales > 0 ? ((totalSummary.creditSales / totalSummary.totalSales) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 mt-6">
        <p>Generated on {format(new Date(), 'MMMM dd, yyyy HH:mm:ss')}</p>
        <p>This report is confidential and for internal use only.</p>
      </div>
    </div>
  );
}