'use client';

import { useState } from 'react';
import { Printer, Download, User, Calendar, DollarSign, ShoppingCart, TrendingUp, Award, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';

interface EmployeeSale {
  id: string;
  receiptNumber: string;
  saleDate: Date;
  totalAmount: number;
  paymentMethod: string;
  itemsCount: number;
  customerName?: string;
  branch: string;
  discountGiven: number;
  taxAmount: number;
  profit: number;
}

interface EmployeePerformanceSummary {
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  totalItems: number;
  totalProfit: number;
  profitMargin: number;
  performanceRating: number; // 1-5 scale
  rank: number;
  targetAchievement: number; // percentage
  customerSatisfaction: number; // 1-10 scale
}

interface EmployeeSalesPerformanceReportProps {
  employee: {
    id: string;
    name: string;
    employeeCode: string;
    position: string;
    department: string;
    email: string;
    phone: string;
    hireDate: Date;
    branch: string;
  };
  sales: EmployeeSale[];
  summary: EmployeePerformanceSummary;
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
  targets?: {
    salesTarget: number;
    transactionTarget: number;
    profitTarget: number;
  };
  onPrintComplete?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

export function EmployeeSalesPerformanceReport({ 
  employee, 
  sales, 
  summary, 
  companySettings = {
    name: 'InventoryPro',
    address: 'Main Office',
    phone: '',
    email: '',
    tin: ''
  },
  dateRange,
  targets = {
    salesTarget: 100000,
    transactionTarget: 100,
    profitTarget: 20000
  },
  onPrintComplete,
  onExportPDF,
  onExportExcel
}: EmployeeSalesPerformanceReportProps) {

  const [isPrinting, setIsPrinting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Employee-Performance-${employee.name}-${format(dateRange.start, 'yyyy-MM-dd')}`,
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
    return `₱${Number(amount).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  const getPerformanceRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (rating: number) => {
    if (rating >= 4.5) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rating >= 3.5) return <Badge variant="default" className="bg-blue-100 text-blue-800">Good</Badge>;
    if (rating >= 2.5) return <Badge variant="secondary">Average</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  const getTargetAchievementColor = (achievement: number) => {
    if (achievement >= 100) return 'text-green-600';
    if (achievement >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleExportPDF = () => {
    console.log('Exporting employee performance report as PDF...');
    onExportPDF?.();
  };

  const handleExportExcel = () => {
    console.log('Exporting employee performance report as Excel...');
    onExportExcel?.();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
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
          onClick={handleExportPDF}
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleExportExcel}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="bg-white text-black">
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
          <h2 className="text-xl font-semibold">Employee Sales Performance Report</h2>
          <p className="text-sm text-gray-600">
            {format(dateRange.start, 'MMMM dd, yyyy')} to {format(dateRange.end, 'MMMM dd, yyyy')}
          </p>
        </div>

        <Separator className="my-4" />

        {/* Employee Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Employee Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Employee Code:</span>
                  <p className="font-semibold">{employee.employeeCode}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <p className="font-semibold">{employee.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Position:</span>
                  <p className="font-semibold">{employee.position}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Department:</span>
                  <p className="font-semibold">{employee.department}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Branch:</span>
                  <p className="font-semibold">{employee.branch}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <p className="font-semibold">{employee.email}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Phone:</span>
                  <p className="font-semibold">{employee.phone}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Hire Date:</span>
                  <p className="font-semibold">{formatDate(employee.hireDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Performance Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Performance Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalSales)}</div>
                <p className="text-xs text-muted-foreground">{summary.totalTransactions} transactions</p>
                <div className={`text-sm font-semibold mt-1 ${getTargetAchievementColor((summary.totalSales / targets.salesTarget) * 100)}`}>
                  {((summary.totalSales / targets.salesTarget) * 100).toFixed(1)}% of target
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Average Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.averageTransaction)}</div>
                <p className="text-xs text-muted-foreground">Per sale</p>
                <div className="text-sm text-muted-foreground mt-1">
                  {summary.totalItems} total items
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Total Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalProfit)}</div>
                <p className="text-xs text-muted-foreground">{summary.profitMargin.toFixed(1)}% margin</p>
                <div className={`text-sm font-semibold mt-1 ${getTargetAchievementColor((summary.totalProfit / targets.profitTarget) * 100)}`}>
                  {((summary.totalProfit / targets.profitTarget) * 100).toFixed(1)}% of target
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Performance Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPerformanceRatingColor(summary.performanceRating)}`}>
                  {summary.performanceRating.toFixed(1)}/5.0
                </div>
                <div className="text-xs text-muted-foreground">
                  Rank #{summary.rank}
                </div>
                <div className="mt-1">
                  {getPerformanceBadge(summary.performanceRating)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Target Achievement */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <span className="text-sm text-muted-foreground">Sales Target Achievement:</span>
              <div className={`font-semibold text-lg ${getTargetAchievementColor((summary.totalSales / targets.salesTarget) * 100)}`}>
                {((summary.totalSales / targets.salesTarget) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Target: {formatCurrency(targets.salesTarget)}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <span className="text-sm text-muted-foreground">Transaction Target Achievement:</span>
              <div className={`font-semibold text-lg ${getTargetAchievementColor((summary.totalTransactions / targets.transactionTarget) * 100)}`}>
                {((summary.totalTransactions / targets.transactionTarget) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Target: {targets.transactionTarget} transactions
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <span className="text-sm text-muted-foreground">Customer Satisfaction:</span>
              <div className={`font-semibold text-lg ${getPerformanceRatingColor(summary.customerSatisfaction / 2)}`}>
                {summary.customerSatisfaction.toFixed(1)}/10.0
              </div>
              <div className="text-xs text-muted-foreground">
                Based on customer feedback
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Sales Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Sales Details
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Branch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(sale.saleDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {sale.receiptNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {sale.paymentMethod.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(sale.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">{sale.itemsCount}</TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      {formatCurrency(sale.profit)}
                    </TableCell>
                    <TableCell className="text-xs">{sale.branch}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mt-6">
          <p>Generated on {format(new Date(), 'MMMM dd, yyyy HH:mm:ss')}</p>
          <p>This report is confidential and for internal use only.</p>
        </div>
      </div>
    </div>
  );
}