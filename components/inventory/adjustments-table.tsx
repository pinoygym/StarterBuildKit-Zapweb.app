'use client';

import { useState } from 'react';
import { Eye, Printer, Copy, RotateCcw } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InventoryAdjustmentWithRelations } from '@/types/inventory-adjustment.types';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useCopyInventoryAdjustment } from '@/hooks/use-inventory-adjustments';
import { toast } from 'sonner';

interface AdjustmentsTableProps {
    adjustments: InventoryAdjustmentWithRelations[];
    loading?: boolean;
}

export function AdjustmentsTable({ adjustments, loading }: AdjustmentsTableProps) {
    const router = useRouter();

    const { mutateAsync: copyAdjustment, isPending: isCopying } = useCopyInventoryAdjustment();
    const [copyingId, setCopyingId] = useState<string | null>(null);

    const handleView = (id: string) => {
        router.push(`/inventory/adjustments/${id}`);
    };

    const handleCopy = async (id: string) => {
        try {
            setCopyingId(id);
            const result = await copyAdjustment(id);
            if (result?.id) {
                router.push(`/inventory/adjustments/${result.id}`);
            }
        } catch (error) {
            // Error handled by hook toast
        } finally {
            setCopyingId(null);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'POSTED': return 'default';
            case 'DRAFT': return 'secondary';
            case 'CANCELLED': return 'destructive';
            default: return 'outline';
        }
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
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Number</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Posted By</TableHead>
                        <TableHead>Last Edited By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {adjustments.map((adjustment) => (
                        <TableRow
                            key={adjustment.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleView(adjustment.id)}
                        >
                            <TableCell className="font-mono font-medium">
                                {adjustment.adjustmentNumber}
                            </TableCell>
                            <TableCell>
                                {adjustment.referenceNumber || '-'}
                            </TableCell>
                            <TableCell>{formatDate(adjustment.adjustmentDate)}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(adjustment.status)}>
                                    {adjustment.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{adjustment.Warehouse.name}</TableCell>
                            <TableCell>{adjustment.Branch.name}</TableCell>
                            <TableCell className="max-w-xs truncate">{adjustment.reason}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                                {adjustment.CreatedBy ? `${adjustment.CreatedBy.firstName} ${adjustment.CreatedBy.lastName}` : '-'}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                                {adjustment.PostedBy ? `${adjustment.PostedBy.firstName} ${adjustment.PostedBy.lastName}` : '-'}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                                {adjustment.UpdatedBy ? `${adjustment.UpdatedBy.firstName} ${adjustment.UpdatedBy.lastName}` : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopy(adjustment.id)}
                                        disabled={copyingId === adjustment.id}
                                        title="Copy Adjustment"
                                    >
                                        <Copy className={`h-4 w-4 ${copyingId === adjustment.id ? 'animate-pulse' : ''}`} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleView(adjustment.id)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
