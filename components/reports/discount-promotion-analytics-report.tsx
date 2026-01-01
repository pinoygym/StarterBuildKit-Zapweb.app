'use client';

import { useState } from 'react';
import { Printer, Download, Tag, TrendingUp, DollarSign, Users, Calendar, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';

interface PromotionUsage {
  id: string;
  promotionName: string;
  promotionCode: string;
  promotionType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BOGO' | 'LOYALTY_POINTS';
  discountValue: number;
  minimumPurchase?: number;
  usageDate: Date;
  customerName: string;
  customerEmail: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  receiptNumber: string;
  branch: string;
  cashier: string;
  status: 'USED' | 'EXPIRED' | 'CANCELLED';
}

interface PromotionSummary {
  promotionName: string;
  promotionCode: string;
  promotionType: string;
  totalUsages: number;
  totalDiscountGiven: number;
  averageDiscountPerUse: number;
  conversionRate: number; // percentage of customers who used it
  totalRevenueGenerated: number;
  effectiveness: number; // ROI calculation
}

interface DiscountAnalyticsSummary {
  totalPromotions: number;
  totalUsages: number;
  totalDiscountGiven: number;
  averageDiscountPerTransaction: number;
  totalRevenueGenerated: number;
  mostEffectivePromotion: string;
  leastEffectivePromotion: string;
  topPerformingBranch: string;
  customerRetentionRate: number;
}

interface DiscountAndPromotionAnalyticsReportProps {
  usages: PromotionUsage[];
  summary: DiscountAnalyticsSummary;
  promotionSummaries: PromotionSummary[];
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
  filters?: {
    promotion?: string;
    promotionType?: string;
    branch?: string;
    status?: string;
  };
  onPrintComplete?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

export function DiscountAndPromotionAnalyticsReport({ 
  usages, 
  summary, 
  promotionSummaries, 
  companySettings = {
    name: 'InventoryPro',
    address: 'Main Office',
    phone: '',
    email: '',
    tin: ''
  },
  dateRange,
  filters = {},
  onPrintComplete,
  onExportPDF,
  onExportExcel
}: DiscountAndPromotionAnalyticsReportProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Discount-Promotion-Analytics-${format(dateRange.start, 'yyyy-MM-dd')}`,
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

  const getPromotionTypeBadge = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Percentage</Badge>;
      case 'FIXED_AMOUNT':
        return <Badge variant="default" className="bg-green-100 text-green-800">Fixed Amount</Badge>;
      case 'BOGO':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Buy One Get One</Badge>;
      case 'LOYALTY_POINTS':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Loyalty Points</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'USED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Used</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">Expired</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 3.0) return 'text-green-600';
    if (effectiveness >= 1.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleExportPDF = () => {
    console.log('Exporting discount and promotion analytics as PDF...');
    onExportPDF?.();
  };

  const handleExportExcel = () => {
    console.log('Exporting discount and promotion analytics as Excel...');
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
          <h2 className="text-xl font-semibold">Discount and Promotion Analytics Report</h2>
          <p className="text-sm text-gray-600">
            {format(dateRange.start, 'MMMM dd, yyyy')} to {format(dateRange.end, 'MMMM dd, yyyy')}
          </p>
          
          {/* Filters Summary */}
          {Object.keys(filters).length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              <p>Filters applied:</p>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {filters.promotion && <Badge variant="outline">Promotion: {filters.promotion}</Badge>}
                {filters.promotionType && <Badge variant="outline">Type: {filters.promotionType}</Badge>}
                {filters.branch && <Badge variant="outline">Branch: {filters.branch}</Badge>}
                {filters.status && <Badge variant="outline">Status: {filters.status}</Badge>}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Total Promotions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalPromotions}</div>
              <p className="text-xs text-muted-foreground">Active promotions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Usages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalUsages}</div>
              <p className="text-xs text-muted-foreground">Times used</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Discount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-{formatCurrency(summary.totalDiscountGiven)}</div>
              <p className="text-xs text-muted-foreground">Given to customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Revenue Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenueGenerated)}</div>
              <p className="text-xs text-muted-foreground">From promotions</p>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Discount per Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatCurrency(summary.averageDiscountPerTransaction)}</div>
              <p className="text-xs text-muted-foreground">Per promotional transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Customer Retention Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-600">{summary.customerRetentionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Return customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Performing Branch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{summary.topPerformingBranch}</div>
              <p className="text-xs text-muted-foreground">Most promotions used</p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-4" />

        {/* Promotion Performance Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Promotion Performance Summary
          </h3>
          <div className="space-y-4">
            {promotionSummaries.map((promo, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{promo.promotionName}</span>
                      <Badge variant="outline" className="text-xs">
                        {promo.promotionCode}
                      </Badge>
                      {getPromotionTypeBadge(promo.promotionType)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {promo.totalUsages} usages • {promo.conversionRate.toFixed(1)}% conversion
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(promo.totalRevenueGenerated)}
                    </div>
                    <div className={`text-sm font-semibold ${getEffectivenessColor(promo.effectiveness)}`}>
                      ROI: {promo.effectiveness.toFixed(1)}x
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Usages:</span>
                    <p className="font-semibold">{promo.totalUsages}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Discount:</span>
                    <p className="font-semibold text-red-600">-{formatCurrency(promo.totalDiscountGiven)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Discount:</span>
                    <p className="font-semibold">{formatCurrency(promo.averageDiscountPerUse)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Conversion Rate:</span>
                    <p className="font-semibold">{promo.conversionRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Detailed Usage History */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detailed Usage History
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Promotion</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Original Amount</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Final Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usages.map((usage) => (
                  <TableRow key={usage.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(usage.usageDate)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{usage.promotionName}</div>
                        <div className="text-xs text-muted-foreground">{usage.promotionCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPromotionTypeBadge(usage.promotionType)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{usage.customerName}</div>
                        <div className="text-xs text-muted-foreground">{usage.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(usage.originalAmount)}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-semibold">
                      -{formatCurrency(usage.discountAmount)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(usage.finalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {usage.receiptNumber}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{usage.branch}</TableCell>
                    <TableCell>
                      {getStatusBadge(usage.status)}
                    </TableCell>
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