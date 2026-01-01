'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VerificationItem {
    id: string;
    productName: string;
    systemQty: number;
    uom: string;
    detectedQty?: number | null;
    status: 'MATCH' | 'MISMATCH' | 'MISSING' | 'PENDING' | 'UNVERIFIED';
}

interface VerificationTableProps {
    items: VerificationItem[];
    onAcceptSystem: (id: string) => void;
    onAcceptDetected: (id: string, qty: number) => void;
}

export function VerificationTable({ items, onAcceptSystem, onAcceptDetected }: VerificationTableProps) {
    return (
        <div className="w-full overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Product</TableHead>
                        <TableHead className="text-right">System Qty</TableHead>
                        <TableHead className="text-right">Image (AI)</TableHead>
                        <TableHead className="text-center">Variance</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => {
                        const hasVariance = item.detectedQty !== undefined && item.detectedQty !== null
                            ? Math.abs(item.systemQty - item.detectedQty) > 0.01
                            : false;

                        const variance = item.detectedQty !== undefined && item.detectedQty !== null
                            ? item.detectedQty - item.systemQty
                            : null;

                        return (
                            <TableRow key={item.id} className={cn(
                                item.status === 'MISMATCH' ? 'bg-red-50 dark:bg-red-950/20' : '',
                                item.status === 'MATCH' ? 'bg-green-50 dark:bg-green-950/20' : ''
                            )}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{item.productName}</span>
                                        <span className="text-xs text-muted-foreground">{item.uom}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-base">
                                    {item.systemQty}
                                </TableCell>
                                <TableCell className="text-right font-mono text-base font-bold text-blue-600 dark:text-blue-400">
                                    {item.detectedQty !== null ? item.detectedQty : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    {variance !== null ? (
                                        <span className={cn(
                                            "font-mono font-bold",
                                            variance > 0 ? "text-green-600" : "text-red-600",
                                            variance === 0 ? "text-muted-foreground opacity-50" : ""
                                        )}>
                                            {variance > 0 ? '+' : ''}{variance}
                                        </span>
                                    ) : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <StatusBadge status={item.status} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {item.status !== 'MATCH' && (
                                            <>
                                                {item.detectedQty !== undefined && item.detectedQty !== null && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                        onClick={() => onAcceptDetected(item.id, item.detectedQty!)}
                                                        title="Accept AI Value"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                                    onClick={() => onAcceptSystem(item.id)}
                                                    title="Confirm System Value"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

function StatusBadge({ status }: { status: VerificationItem['status'] }) {
    switch (status) {
        case 'MATCH':
            return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Match</Badge>;
        case 'MISMATCH':
            return <Badge variant="destructive">Mismatch</Badge>;
        case 'MISSING':
            return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">Missing</Badge>;
        case 'PENDING':
            return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
        default:
            return <Badge variant="outline">Unknown</Badge>;
    }
}
