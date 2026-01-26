'use client';

import { Eye } from 'lucide-react';
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
import { InventoryTransferWithRelations } from '@/types/inventory-transfer.types';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface TransfersTableProps {
    transfers: InventoryTransferWithRelations[];
    loading?: boolean;
}

export function TransfersTable({ transfers, loading }: TransfersTableProps) {
    const router = useRouter();

    const handleView = (id: string) => {
        router.push(`/inventory/transfers/${id}`);
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
        return <div className="text-center py-8">Loading transfers...</div>;
    }

    if (transfers.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No transfer slips found
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
                        <TableHead>From Warehouse</TableHead>
                        <TableHead>To Warehouse</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transfers.map((transfer) => (
                        <TableRow
                            key={transfer.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleView(transfer.id)}
                        >
                            <TableCell className="font-mono font-medium text-primary">
                                {transfer.transferNumber}
                            </TableCell>
                            <TableCell>
                                {transfer.referenceNumber || '-'}
                            </TableCell>
                            <TableCell>{formatDate(transfer.transferDate)}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(transfer.status)}>
                                    {transfer.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{transfer.sourceWarehouse.name}</TableCell>
                            <TableCell>{transfer.destinationWarehouse.name}</TableCell>
                            <TableCell>{transfer.Branch.name}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                                {transfer.CreatedBy ? `${transfer.CreatedBy.firstName} ${transfer.CreatedBy.lastName}` : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleView(transfer.id)}
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
