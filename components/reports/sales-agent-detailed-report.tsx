'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesAgentDetailedTransaction } from '@/services/reports/sales-agent-reports.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SalesAgentDetailedReportProps {
    agentId: string;
    startDate?: Date;
    endDate?: Date;
    branchId?: string;
    onBack: () => void;
}

export function SalesAgentDetailedReport({
    agentId,
    startDate,
    endDate,
    branchId,
    onBack,
}: SalesAgentDetailedReportProps) {
    const [data, setData] = useState<SalesAgentDetailedTransaction[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('type', 'detailed');
                params.set('agentId', agentId);
                if (startDate) params.set('startDate', startDate.toISOString());
                if (endDate) params.set('endDate', endDate.toISOString());
                if (branchId) params.set('branchId', branchId);

                const response = await fetch(`/api/reports/sales-agents?${params.toString()}`);
                const result = await response.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (error) {
                console.error('Error fetching detailed report:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [agentId, startDate, endDate, branchId]);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle>Detailed Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Receipt #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead className="text-right">Items</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No transactions found for this period.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{formatDate(tx.date)}</TableCell>
                                    <TableCell className="font-mono">{tx.receiptNumber}</TableCell>
                                    <TableCell>{tx.customerName}</TableCell>
                                    <TableCell className="capitalize">{tx.paymentMethod.replace('_', ' ')}</TableCell>
                                    <TableCell className="text-right">{tx.itemsCount}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(tx.totalAmount)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
