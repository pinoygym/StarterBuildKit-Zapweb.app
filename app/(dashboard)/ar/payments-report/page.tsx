'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { ARPaymentsReport } from '@/components/ar/ar-payments-report';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { ARPaymentReportResponse } from '@/types/ar.types';
import { exportData, ExportFormat } from '@/lib/export-utils';
import { toast } from 'sonner';

export default function ARPaymentsReportPage() {
    const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
    const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));
    const [branchId, setBranchId] = useState<string>('');
    const [customerName, setCustomerName] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [referenceNumber, setReferenceNumber] = useState<string>('');

    // Fetch branches for filter
    const { data: branchesResponse } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const response = await fetch('/api/branches');
            if (!response.ok) throw new Error('Failed to fetch branches');
            return response.json();
        },
    });

    const branches = branchesResponse?.data || [];

    // Build query params
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate.toISOString());
        if (toDate) params.append('toDate', toDate.toISOString());
        if (branchId) params.append('branchId', branchId);
        if (customerName) params.append('customerName', customerName);
        if (paymentMethod) params.append('paymentMethod', paymentMethod);
        if (referenceNumber) params.append('referenceNumber', referenceNumber);
        return params.toString();
    }, [fromDate, toDate, branchId, customerName, paymentMethod, referenceNumber]);

    // Fetch report data
    const { data: reportData, isLoading, refetch } = useQuery<ARPaymentReportResponse>({
        queryKey: ['ar-payments-report', queryParams],
        queryFn: async () => {
            const response = await fetch(`/api/ar/payments-report?${queryParams}`);
            if (!response.ok) throw new Error('Failed to fetch AR payments report');
            return response.json();
        },
    });

    const handleClearFilters = () => {
        setFromDate(startOfMonth(new Date()));
        setToDate(endOfMonth(new Date()));
        setBranchId('');
        setCustomerName('');
        setPaymentMethod('');
        setReferenceNumber('');
    };

    const handleExport = () => {
        if (!reportData || reportData.payments.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = [
            'Payment Date',
            'Reference Number',
            'Customer',
            'Branch',
            'Branch Code',
            'Payment Method',
            'Amount',
        ];

        const data = reportData.payments.map((payment) => [
            format(new Date(payment.paymentDate), 'yyyy-MM-dd'),
            payment.referenceNumber || '-',
            payment.customerName,
            payment.branchName,
            payment.branchCode,
            payment.paymentMethod,
            payment.amount,
        ]);

        exportData(
            { headers, data },
            {
                format: 'csv' as ExportFormat,
                filename: `AR-Payments-Report-${format(new Date(), 'yyyy-MM-dd')}`,
            }
        );

        toast.success('Report exported successfully');
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="AR Payments Received Report"
                description="View all payments received from customers with detailed breakdowns"
            />

            {/* Filters Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Date Range */}
                        <div className="space-y-2">
                            <Label>From Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !fromDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {fromDate ? format(fromDate, 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={fromDate}
                                        onSelect={(date) => date && setFromDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>To Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !toDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {toDate ? format(toDate, 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={toDate}
                                        onSelect={(date) => date && setToDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Branch Filter */}
                        <div className="space-y-2">
                            <Label>Branch</Label>
                            <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Branches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {branches.map((branch: any) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name} ({branch.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Customer Name */}
                        <div className="space-y-2">
                            <Label>Customer Name</Label>
                            <Input
                                placeholder="Search by customer name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select value={paymentMethod || 'all'} onValueChange={(v) => setPaymentMethod(v === 'all' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Methods" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Methods</SelectItem>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Card">Card</SelectItem>
                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="Check">Check</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reference Number */}
                        <div className="space-y-2">
                            <Label>Reference Number</Label>
                            <Input
                                placeholder="Search by reference"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button onClick={() => refetch()}>
                            <Search className="h-4 w-4 mr-2" />
                            Apply Filters
                        </Button>
                        <Button variant="outline" onClick={handleClearFilters}>
                            <X className="h-4 w-4 mr-2" />
                            Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Report */}
            <ARPaymentsReport
                data={reportData?.payments || []}
                summary={reportData?.summary || {
                    totalAmount: 0,
                    totalPayments: 0,
                    byPaymentMethod: [],
                    byBranch: [],
                }}
                loading={isLoading}
                onExport={handleExport}
                filters={{
                    fromDate,
                    toDate,
                    branchId,
                    customerName,
                    paymentMethod,
                    referenceNumber,
                }}
            />
        </div>
    );
}
