'use client';

import { useState } from 'react';
import { Eye, Printer } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AdjustmentSlip } from '@/types/inventory.types';
import { formatDate } from '@/lib/utils';
import { AdjustmentSlipPrint } from './adjustment-slip-print';
import { AdjustmentDetailDialog } from './adjustment-detail-dialog';

interface AdjustmentsTableProps {
    adjustments: AdjustmentSlip[];
    loading?: boolean;
}

export function AdjustmentsTable({ adjustments, loading }: AdjustmentsTableProps) {
    const [selectedAdjustment, setSelectedAdjustment] = useState<AdjustmentSlip | null>(null);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    const handleView = (adjustment: AdjustmentSlip) => {
        setSelectedAdjustment(adjustment);
        setDetailDialogOpen(true);
    };

    const handlePrint = (adjustment: AdjustmentSlip) => {
        setSelectedAdjustment(adjustment);
        setPrintDialogOpen(true);
    };

    if (loading) {
        return <div className="text-center py-8">Loading adjustments...</div>;
    }

    if (adjustments.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No adjustment slips found
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reference Number</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Warehouse</TableHead>
                            <TableHead className="text-center">Items</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {adjustments.map((adjustment) => (
                            <TableRow
                                key={adjustment.referenceId}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleView(adjustment)}
                            >
                                <TableCell className="font-mono font-medium">
                                    {adjustment.referenceNumber || adjustment.referenceId.substring(0, 8)}
                                </TableCell>
                                <TableCell>{formatDate(adjustment.adjustmentDate)}</TableCell>
                                <TableCell>{adjustment.warehouseName}</TableCell>
                                <TableCell className="text-center">{adjustment.totalItems}</TableCell>
                                <TableCell className="max-w-xs truncate">{adjustment.reason}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleView(adjustment)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePrint(adjustment)}
                                        >
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Detail Dialog */}
            {selectedAdjustment && (
                <AdjustmentDetailDialog
                    adjustment={selectedAdjustment}
                    open={detailDialogOpen}
                    onClose={() => setDetailDialogOpen(false)}
                    onPrint={() => {
                        setDetailDialogOpen(false);
                        setPrintDialogOpen(true);
                    }}
                />
            )}

            {/* Print Dialog */}
            {selectedAdjustment && (
                <AdjustmentSlipPrint
                    adjustment={selectedAdjustment}
                    open={printDialogOpen}
                    onClose={() => setPrintDialogOpen(false)}
                />
            )}
        </>
    );
}
