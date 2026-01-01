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
import { SalesAgentPerformanceSummary } from '@/services/reports/sales-agent-reports.service';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SalesAgentPerformanceProps {
    startDate?: Date;
    endDate?: Date;
    branchId?: string;
    onViewDetails?: (agentId: string) => void;
}

export function SalesAgentPerformance({
    startDate,
    endDate,
    branchId,
    onViewDetails,
}: SalesAgentPerformanceProps) {
    const [data, setData] = useState<SalesAgentPerformanceSummary[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('type', 'summary');
                if (startDate) params.set('startDate', startDate.toISOString());
                if (endDate) params.set('endDate', endDate.toISOString());
                if (branchId) params.set('branchId', branchId);

                const response = await fetch(`/api/reports/sales-agents?${params.toString()}`);
                const result = await response.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (error) {
                console.error('Error fetching sales agent performance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [startDate, endDate, branchId]);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Agent Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead className="text-right">Transactions</TableHead>
                            <TableHead className="text-right">Total Sales</TableHead>
                            <TableHead className="text-right">Avg. Sale Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No data available for the selected period.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((agent) => (
                                <TableRow
                                    key={agent.agentId}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => onViewDetails?.(agent.agentId)}
                                >
                                    <TableCell className="font-medium">{agent.agentName}</TableCell>
                                    <TableCell>{agent.agentCode}</TableCell>
                                    <TableCell className="text-right">{agent.transactionCount}</TableCell>
                                    <TableCell className="text-right text-green-600 font-bold">
                                        {formatCurrency(agent.totalSales)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(agent.averageSaleValue)}
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
