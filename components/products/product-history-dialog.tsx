'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { X, Printer, Download, ArrowUp, ArrowDown, RotateCcw, Package, Calendar, Warehouse } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useToast } from '@/hooks/use-toast';
import { formatQuantity } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';

interface ProductHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productId: string;
    productName?: string;
}

interface ProductHistoryData {
    product: {
        id: string;
        name: string;
        baseUOM: string;
        category: string;
        productUOMs: Array<{
            id: string;
            name: string;
            conversionFactor: number;
        }>;
    };
    summary: {
        received: number;
        salesReturns: number;
        adjustmentsIn: number;
        transfersIn: number;
        sold: number;
        vendorReturns: number;
        adjustmentsOut: number;
        transfersOut: number;
        currentStock: number;
        netMovement: number;
    };
    movements: Array<{
        id: string;
        type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
        details: string;
        quantityChange: number;
        runningBalance: number;
        status: string;
        warehouseName: string;
        date: Date;
        documentNumber: string | null;
        referenceType: string | null;
        referenceId: string | null;
    }>;
}

export function ProductHistoryDialog({
    open,
    onOpenChange,
    productId,
    productName,
}: ProductHistoryDialogProps) {
    const { toast } = useToast();
    const { data: warehouses = [] } = useWarehouses();
    const printRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [historyData, setHistoryData] = useState<ProductHistoryData | null>(null);
    const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (warehouseFilter !== 'all') {
                params.append('warehouseId', warehouseFilter);
            }
            if (dateFrom) {
                params.append('dateFrom', dateFrom.toISOString());
            }
            if (dateTo) {
                params.append('dateTo', dateTo.toISOString());
            }

            const response = await fetch(`/api/products/${productId}/history?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setHistoryData(data.data);
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to fetch product history',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error fetching product history:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch product history',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && productId) {
            fetchHistory();
        }
    }, [open, productId, warehouseFilter, dateFrom, dateTo]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Stock-Card-${historyData?.product.name || 'Product'}`,
    });

    const exportToCSV = () => {
        if (!historyData) return;

        const headers = ['Date', 'Type', 'Details', 'Qty Change', 'Balance', 'Warehouse', 'Doc #'];
        const rows = historyData.movements.map((movement) => [
            format(new Date(movement.date), 'yyyy-MM-dd HH:mm:ss'),
            movement.type,
            movement.details,
            movement.quantityChange.toString(),
            movement.runningBalance.toString(),
            movement.warehouseName,
            movement.documentNumber || '-',
        ]);

        const csvContent = [
            `Product: ${historyData.product.name}`,
            `UOM: ${historyData.product.baseUOM}`,
            `Current Stock: ${historyData.summary.currentStock}`,
            '',
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-card-${historyData.product.name}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
            title: 'Success',
            description: 'Stock card exported to CSV',
        });
    };

    const getMovementBadge = (type: string) => {
        switch (type) {
            case 'IN':
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">IN</Badge>;
            case 'OUT':
                return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">OUT</Badge>;
            case 'ADJUSTMENT':
                return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">ADJ</Badge>;
            case 'TRANSFER':
                return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">TRF</Badge>;
            default:
                return <Badge>{type}</Badge>;
        }
    };

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'IN':
                return <ArrowUp className="h-4 w-4 text-green-600" />;
            case 'OUT':
                return <ArrowDown className="h-4 w-4 text-red-600" />;
            case 'ADJUSTMENT':
                return <RotateCcw className="h-4 w-4 text-yellow-600" />;
            case 'TRANSFER':
                return <Package className="h-4 w-4 text-blue-600" />;
            default:
                return <Package className="h-4 w-4" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[98vw] !w-[98vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Stock Card - {productName || historyData?.product.name || 'Loading...'}
                    </DialogTitle>
                </DialogHeader>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-4 no-print">
                    <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Warehouse className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="All Warehouses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Warehouses</SelectItem>
                            {warehouses.map((warehouse) => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn(!dateFrom && 'text-muted-foreground')}>
                                <Calendar className="h-4 w-4 mr-2" />
                                {dateFrom ? format(dateFrom, 'MMM dd, yyyy') : 'From Date'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                                mode="single"
                                selected={dateFrom}
                                onSelect={setDateFrom}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn(!dateTo && 'text-muted-foreground')}>
                                <Calendar className="h-4 w-4 mr-2" />
                                {dateTo ? format(dateTo, 'MMM dd, yyyy') : 'To Date'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                                mode="single"
                                selected={dateTo}
                                onSelect={setDateTo}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {(dateFrom || dateTo) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setDateFrom(undefined);
                                setDateTo(undefined);
                            }}
                        >
                            <X className="h-4 w-4 mr-1" /> Clear Dates
                        </Button>
                    )}

                    <div className="flex-1" />

                    <Button variant="outline" onClick={() => handlePrint()} disabled={loading || !historyData}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                    <Button variant="outline" onClick={exportToCSV} disabled={loading || !historyData}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : historyData ? (
                    <div ref={printRef} className="space-y-6">
                        {/* Product Info */}
                        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold">{historyData.product.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>Category: <Badge variant="outline">{historyData.product.category}</Badge></span>
                                    <span>UOM: <code className="bg-muted px-2 py-0.5 rounded">{historyData.product.baseUOM}</code></span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{formatQuantity(historyData.summary.currentStock)} {historyData.product.baseUOM}</div>
                                <div className="text-sm text-muted-foreground">Current Stock</div>
                                {historyData.product.productUOMs && historyData.product.productUOMs.length > 0 && (
                                    <div className="flex flex-col gap-0.5 mt-2 text-xs text-muted-foreground">
                                        {historyData.product.productUOMs.map((uom) => {
                                            const converted = historyData.summary.currentStock / Number(uom.conversionFactor);
                                            return (
                                                <div key={uom.id} className="flex justify-end gap-1">
                                                    <span className="font-medium">{formatQuantity(converted)}</span>
                                                    <span>{uom.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-green-600">Quantities In ({historyData.product.baseUOM})</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Received:</span>
                                        <span className="font-medium">{formatQuantity(historyData.summary.received)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Returns:</span>
                                        <span className="font-medium">{formatQuantity(historyData.summary.salesReturns)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Adjustments:</span>
                                        <span className="font-medium">{formatQuantity(historyData.summary.adjustmentsIn)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Transfers:</span>
                                        <span className="font-medium">{formatQuantity(historyData.summary.transfersIn)}</span>
                                    </div>
                                    <Separator className="my-1" />
                                    <div className="flex justify-between font-semibold">
                                        <span>Total:</span>
                                        <span className="text-green-600">
                                            {formatQuantity(
                                                historyData.summary.received +
                                                historyData.summary.salesReturns +
                                                historyData.summary.adjustmentsIn +
                                                historyData.summary.transfersIn
                                            )}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-red-600">Quantities Out ({historyData.product.baseUOM})</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sold:</span>
                                        <span className="font-medium">{formatQuantity(historyData.summary.sold)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Returns:</span>
                                        <span className="font-medium">{formatQuantity(historyData.summary.vendorReturns)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Adjustments:</span>
                                        <span className="font-medium">{formatQuantity(historyData.summary.adjustmentsOut)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Transfers:</span>
                                        <span className="font-medium">{formatQuantity(historyData.summary.transfersOut)}</span>
                                    </div>
                                    <Separator className="my-1" />
                                    <div className="flex justify-between font-semibold">
                                        <span>Total:</span>
                                        <span className="text-red-600">
                                            {formatQuantity(
                                                historyData.summary.sold +
                                                historyData.summary.vendorReturns +
                                                historyData.summary.adjustmentsOut +
                                                historyData.summary.transfersOut
                                            )}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Net Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-muted/50 rounded">
                                            <div className={cn(
                                                'text-2xl font-bold',
                                                historyData.summary.netMovement >= 0 ? 'text-green-600' : 'text-red-600'
                                            )}>
                                                {historyData.summary.netMovement >= 0 ? '+' : ''}{formatQuantity(historyData.summary.netMovement)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Net Movement</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/50 rounded">
                                            <div className="text-2xl font-bold text-primary">
                                                {formatQuantity(historyData.summary.currentStock)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Current Stock</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Separator />

                        {/* Movements Table */}
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Transaction History</h4>
                            {historyData.movements.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No movements found for this product.
                                </div>
                            ) : (
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Details</TableHead>
                                                <TableHead className="text-right">Qty Change ({historyData.product.baseUOM})</TableHead>
                                                <TableHead className="text-right">Balance ({historyData.product.baseUOM})</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Warehouse</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Doc #</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {historyData.movements.map((movement) => (
                                                <TableRow key={movement.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getMovementIcon(movement.type)}
                                                            {getMovementBadge(movement.type)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate" title={movement.details}>
                                                        {movement.details}
                                                    </TableCell>
                                                    <TableCell className={cn(
                                                        'text-right font-medium',
                                                        movement.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'
                                                    )}>
                                                        {movement.quantityChange >= 0 ? '+' : ''}{formatQuantity(movement.quantityChange)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatQuantity(movement.runningBalance)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{movement.status}</Badge>
                                                    </TableCell>
                                                    <TableCell>{movement.warehouseName}</TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {format(new Date(movement.date), 'MMM dd, yyyy HH:mm')}
                                                    </TableCell>
                                                    <TableCell>
                                                        {movement.documentNumber ? (
                                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                                {movement.documentNumber.slice(0, 8)}...
                                                            </code>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>

                        {/* Print Footer */}
                        <div className="text-center text-sm text-muted-foreground pt-4 hidden print:block">
                            <p>Generated on {format(new Date(), 'MMMM dd, yyyy HH:mm:ss')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        No data available.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
