'use client';

import { Printer } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { AdjustmentSlip } from '@/types/inventory.types';
import { formatDate } from '@/lib/utils';

interface AdjustmentDetailDialogProps {
    adjustment: AdjustmentSlip;
    open: boolean;
    onClose: () => void;
    onPrint: () => void;
}

export function AdjustmentDetailDialog({
    adjustment,
    open,
    onClose,
    onPrint,
}: AdjustmentDetailDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Adjustment Slip Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Reference Number</p>
                            <p className="font-mono font-medium">
                                {adjustment.referenceNumber || adjustment.referenceId}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="font-medium">{formatDate(adjustment.adjustmentDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Warehouse</p>
                            <p className="font-medium">{adjustment.warehouseName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Items</p>
                            <p className="font-medium">{adjustment.totalItems}</p>
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Reason</p>
                        <p className="text-sm bg-muted p-3 rounded-md">{adjustment.reason}</p>
                    </div>

                    {/* Items Table */}
                    <div>
                        <p className="text-sm font-medium mb-2">Adjusted Items</p>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-center">UOM</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adjustment.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell className="text-center">{item.baseUOM}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {item.quantity}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onPrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
