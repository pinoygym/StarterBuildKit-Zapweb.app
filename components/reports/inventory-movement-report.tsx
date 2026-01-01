'use client';

import { useState } from 'react';
import { Printer, Download, Package, ArrowUp, ArrowDown, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';

interface InventoryMovementItem {
  id: string;
  productName: string;
  productCode: string;
  category: string;
  uom: string;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceNumber: string;
  sourceDocument: string;
  warehouse: string;
  branch: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
  balanceAfter: number;
}

interface InventoryMovementSummary {
  totalMovements: number;
  totalIn: number;
  totalOut: number;
  totalAdjustments: number;
  totalTransfers: number;
  totalValueIn: number;
  totalValueOut: number;
  netMovement: number;
  netValue: number;
}

interface InventoryMovementReportProps {
  movements: InventoryMovementItem[];
  summary: InventoryMovementSummary;
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
    product?: string;
    category?: string;
    movementType?: string;
    warehouse?: string;
    branch?: string;
  };
  onPrintComplete?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

export function InventoryMovementReport({ 
  movements, 
  summary, 
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
}: InventoryMovementReportProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Inventory-Movement-Report-${format(dateRange.start, 'yyyy-MM-dd')}`,
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
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'IN':
        return <Badge variant="default" className="bg-green-100 text-green-800">IN</Badge>;
      case 'OUT':
        return <Badge variant="destructive">OUT</Badge>;
      case 'ADJUSTMENT':
        return <Badge variant="secondary">ADJUST</Badge>;
      case 'TRANSFER':
        return <Badge variant="outline">TRANSFER</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'OUT':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'ADJUSTMENT':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      case 'TRANSFER':
        return <Package className="h-4 w-4 text-purple-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleExportPDF = () => {
    console.log('Exporting inventory movement report as PDF...');
    onExportPDF?.();
  };

  const handleExportExcel = () => {
    console.log('Exporting inventory movement report as Excel...');
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
          <h2 className="text-xl font-semibold">Inventory Movement Report</h2>
          <p className="text-sm text-gray-600">
            {format(dateRange.start, 'MMMM dd, yyyy')} to {format(dateRange.end, 'MMMM dd, yyyy')}
          </p>
          
          {/* Filters Summary */}
          {Object.keys(filters).length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              <p>Filters applied:</p>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {filters.product && <Badge variant="outline">Product: {filters.product}</Badge>}
                {filters.category && <Badge variant="outline">Category: {filters.category}</Badge>}
                {filters.movementType && <Badge variant="outline">Type: {filters.movementType}</Badge>}
                {filters.warehouse && <Badge variant="outline">Warehouse: {filters.warehouse}</Badge>}
                {filters.branch && <Badge variant="outline">Branch: {filters.branch}</Badge>}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalMovements}</div>
              <p className="text-xs text-muted-foreground">Transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stock In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.totalIn}</div>
              <p className="text-xs text-muted-foreground">Units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stock Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.totalOut}</div>
              <p className="text-xs text-muted-foreground">Units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.totalAdjustments}</div>
              <p className="text-xs text-muted-foreground">Adjustments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{summary.totalTransfers}</div>
              <p className="text-xs text-muted-foreground">Transfers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Movement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.netMovement >= 0 ? '+' : ''}{summary.netMovement}
              </div>
              <p className="text-xs text-muted-foreground">Units</p>
            </CardContent>
          </Card>
        </div>

        {/* Value Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Value In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalValueIn)}</div>
              <p className="text-xs text-muted-foreground">Total value of stock in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Value Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalValueOut)}</div>
              <p className="text-xs text-muted-foreground">Total value of stock out</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.netValue >= 0 ? '+' : ''}{formatCurrency(summary.netValue)}
              </div>
              <p className="text-xs text-muted-foreground">Net value movement</p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-4" />

        {/* Detailed Movements Table */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Detailed Movements</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDate(movement.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.productName}</div>
                        <div className="text-xs text-muted-foreground">{movement.productCode}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.movementType)}
                        {getMovementBadge(movement.movementType)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {movement.movementType === 'IN' ? '+' : ''}{movement.quantity}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(movement.unitCost)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(movement.totalCost)}</TableCell>
                    <TableCell className="text-right">{movement.balanceAfter}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {movement.referenceNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>{movement.warehouse}</TableCell>
                    <TableCell>{movement.branch}</TableCell>
                    <TableCell className="text-xs">{movement.createdBy}</TableCell>
                    <TableCell className="text-xs max-w-32 truncate">{movement.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Summary by Movement Type */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Summary by Movement Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'].map((type) => {
              const typeMovements = movements.filter(m => m.movementType === type);
              const totalQuantity = typeMovements.reduce((sum, m) => sum + m.quantity, 0);
              const totalValue = typeMovements.reduce((sum, m) => sum + m.totalCost, 0);
              
              return (
                <Card key={type}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {getMovementIcon(type)}
                      {type.replace('_', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{totalQuantity}</div>
                    <p className="text-xs text-muted-foreground">{typeMovements.length} transactions</p>
                    <p className="text-sm font-semibold mt-1">{formatCurrency(totalValue)}</p>
                  </CardContent>
                </Card>
              );
            })}
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