'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Printer, DollarSign, Receipt, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ARPaymentReportItem } from '@/types/ar.types';
import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface ARPaymentsReportProps {
  data: ARPaymentReportItem[];
  summary: {
    totalAmount: number;
    totalPayments: number;
    byPaymentMethod: {
      method: string;
      count: number;
      amount: number;
    }[];
    byBranch: {
      branchName: string;
      count: number;
      amount: number;
    }[];
  };
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
  filters: {
    fromDate?: Date;
    toDate?: Date;
    branchId?: string;
    customerName?: string;
    paymentMethod?: string;
    referenceNumber?: string;
  };
  onPrintComplete?: () => void;
}

export function ARPaymentsReport({
  data,
  summary,
  loading,
  onExport,
  companySettings = {
    name: 'InventoryPro',
    address: 'Main Office',
    phone: '',
    email: '',
    tin: ''
  },
  filters,
  onPrintComplete
}: ARPaymentsReportProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `AR-Payments-Report-${format(new Date(), 'yyyy-MM-dd')}`,
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      onPrintComplete?.();
    },
    pageStyle: `
      @page {
        size: A4 landscape;
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
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodLower = method.toLowerCase();
    if (methodLower.includes('cash')) return <Badge variant="default">Cash</Badge>;
    if (methodLower.includes('card') || methodLower.includes('credit')) return <Badge variant="secondary">Card</Badge>;
    if (methodLower.includes('bank') || methodLower.includes('transfer')) return <Badge variant="outline">Bank Transfer</Badge>;
    if (methodLower.includes('check')) return <Badge className="bg-purple-100 text-purple-800">Check</Badge>;
    return <Badge variant="outline">{method}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            AR Payments Received Report
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
        <h2 className="text-xl font-semibold">Accounts Receivable - Payments Received Report</h2>
        {filters.fromDate && filters.toDate && (
          <p className="text-sm text-gray-600">
            {format(filters.fromDate, 'MMMM dd, yyyy')} to {format(filters.toDate, 'MMMM dd, yyyy')}
          </p>
        )}
        {filters.branchId && (
          <p className="text-sm text-gray-600">Branch Filter Applied</p>
        )}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Amount Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalPayments} payment{summary.totalPayments !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Payment Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(summary.totalPayments > 0 ? summary.totalAmount / summary.totalPayments : 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Branches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.byBranch.length}</div>
            <p className="text-xs text-muted-foreground">
              {summary.byPaymentMethod.length} payment method{summary.byPaymentMethod.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payment Details
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onExport} className="no-print">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Date</TableHead>
                <TableHead>Reference Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell>{payment.referenceNumber || '-'}</TableCell>
                  <TableCell>{payment.customerName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{payment.branchName}</span>
                      <span className="text-xs text-muted-foreground">{payment.branchCode}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getPaymentMethodBadge(payment.paymentMethod)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(payment.amount)}</TableCell>
                </TableRow>
              ))}

              {/* Totals Row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={5}>TOTAL</TableCell>
                <TableCell className="text-right">{formatCurrency(summary.totalAmount)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Payment Method Breakdown */}
          {summary.byPaymentMethod.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Payment Method Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {summary.byPaymentMethod.map((method) => (
                  <div key={method.method}>
                    <div className="text-muted-foreground">{method.method}</div>
                    <div className="font-semibold">{formatCurrency(method.amount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {method.count} payment{method.count !== 1 ? 's' : ''} ({summary.totalAmount > 0 ? ((method.amount / summary.totalAmount) * 100).toFixed(1) : 0}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Branch Breakdown */}
          {summary.byBranch.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Branch Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {summary.byBranch.map((branch) => (
                  <div key={branch.branchName}>
                    <div className="text-muted-foreground">{branch.branchName}</div>
                    <div className="font-semibold">{formatCurrency(branch.amount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {branch.count} payment{branch.count !== 1 ? 's' : ''} ({summary.totalAmount > 0 ? ((branch.amount / summary.totalAmount) * 100).toFixed(1) : 0}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
