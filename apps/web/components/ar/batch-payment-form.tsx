'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Search, Banknote, FileText, CreditCard, Building2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, formatCurrency } from '@/lib/utils';
import { useCustomers } from '@/hooks/use-customers';
import { useAR } from '@/hooks/use-ar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Check } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const batchPaymentSchema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    customerName: z.string(),
    totalAmount: z.number().positive('Payment amount must be greater than 0'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    referenceNumber: z.string().optional(),
    checkNumber: z.string().optional(),
    invoiceNumber: z.string().optional(),
    withholdingTax: z.number().optional(),
    salesDiscount: z.number().optional(),
    rebates: z.number().optional(),
    taxExemption: z.number().optional(),
    underpaymentOption: z.enum(['leave', 'writeoff']).default('leave'),
    paymentDate: z.date({
        required_error: 'Payment date is required',
    }),
    allocations: z.array(z.object({
        arId: z.string(),
        salesOrderId: z.string().nullable(),
        amount: z.number().min(0),
        balance: z.number(),
        isSelected: z.boolean().default(false),
    })),
}).refine((data) => {
    const allocated = data.allocations.reduce((sum, item) => sum + (item.isSelected ? item.amount : 0), 0);
    // Allow small float difference
    return Math.abs(allocated - data.totalAmount) <= 0.01;
}, {
    message: 'Allocated amount must equal total payment amount',
    path: ['totalAmount'],
});

type BatchPaymentFormData = z.infer<typeof batchPaymentSchema>;

interface BatchPaymentFormProps {
    onSubmit: (data: BatchPaymentFormData) => Promise<boolean>;
    onCancel: () => void;
}

export function BatchPaymentForm({ onSubmit, onCancel }: BatchPaymentFormProps) {
    const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
    const [showAdditionalFields, setShowAdditionalFields] = useState(false);

    const { data: customers } = useCustomers({ status: 'active' });

    const form = useForm<BatchPaymentFormData>({
        resolver: zodResolver(batchPaymentSchema),
        defaultValues: {
            customerId: '',
            customerName: '',
            totalAmount: 0,
            paymentMethod: 'Check',
            referenceNumber: '',
            checkNumber: '',
            invoiceNumber: '',
            withholdingTax: 0,
            salesDiscount: 0,
            rebates: 0,
            taxExemption: 0,
            underpaymentOption: 'leave' as const,
            paymentDate: new Date(),
            allocations: [],
        },
    });

    // Use useWatch instead of form.watch() to optimize subscriptions
    const selectedCustomerId = useWatch({
        control: form.control,
        name: 'customerId',
    });
    const totalPaymentAmount = useWatch({
        control: form.control,
        name: 'totalAmount',
    });
    const watchedAllocations = useWatch({
        control: form.control,
        name: 'allocations',
    });

    // Fetch pending ARs for selected customer - only when customer is selected
    const { records: arRecords, loading: arLoading } = useAR(
        selectedCustomerId ? {
            customerId: selectedCustomerId,
            status: 'pending' // pending or partial
        } : undefined
    );

    const { fields, replace } = useFieldArray({
        control: form.control,
        name: 'allocations',
    });

    // Populate allocations when customer changes
    useEffect(() => {
        // Clear allocations when customer changes
        if (!selectedCustomerId) {
            replace([]);
            return;
        }

        // Wait for AR records to load
        if (arLoading) {
            return;
        }

        // Populate allocations from AR records
        if (arRecords && arRecords.length > 0) {
            const newAllocations = arRecords
                .filter((ar: any) => ar.status !== 'paid' && Number(ar.balance) > 0)
                .map((ar: any) => ({
                    arId: ar.id,
                    salesOrderId: ar.salesOrderId,
                    amount: 0,
                    balance: Number(ar.balance),
                    isSelected: false,
                }));
            replace(newAllocations);
        } else {
            replace([]);
        }
    }, [selectedCustomerId, arLoading]);

    // Handle total amount change to auto-allocate
    const autoAllocate = () => {
        const total = form.getValues('totalAmount');
        let remaining = total;

        // Get current allocations
        const currentAllocations = form.getValues('allocations');

        // Sort by due date (implied by ID order usually, but backend sort is better) or oldest first
        // For now, we allocate top-down
        const newAllocations = currentAllocations.map(item => {
            if (remaining <= 0) {
                return { ...item, amount: 0, isSelected: false };
            }

            const allocate = Math.min(remaining, item.balance);
            remaining -= allocate;

            return {
                ...item,
                amount: Number(allocate.toFixed(2)),
                isSelected: allocate > 0
            };
        });

        replace(newAllocations);
    };

    // Calculate allocated total from watched allocations
    const currentAllocatedTotal = useMemo(() => {
        if (!watchedAllocations) return 0;
        return watchedAllocations.reduce((sum, item) => {
            return sum + (item?.isSelected ? (item?.amount || 0) : 0);
        }, 0);
    }, [watchedAllocations]);

    // Calculate customer balance
    const customerBalance = useMemo(() => {
        if (!arRecords || arRecords.length === 0) return 0;
        return arRecords.reduce((sum: number, ar: any) => sum + Number(ar.balance), 0);
    }, [arRecords]);

    // Payment method options with icons
    const paymentMethods = [
        { value: 'Cash', label: 'Cash', icon: Banknote },
        { value: 'Check', label: 'Check', icon: FileText },
        { value: 'Credit Card', label: 'Credit/Debit', icon: CreditCard },
        { value: 'Bank Transfer', label: 'e-Check', icon: Building2 },
    ];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* QuickBooks-Style Header Bar */}
                <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            {/* Customer Selector */}
                            <FormField
                                control={form.control}
                                name="customerId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-sm font-semibold">RECEIVED FROM</FormLabel>
                                        <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "justify-between h-10 bg-background",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? (() => {
                                                                const c = customers.find(c => c.id === field.value);
                                                                return c ? (c.companyName || c.contactPerson) : "Select customer";
                                                            })()
                                                            : "Select customer"}
                                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search customer..." />
                                                    <CommandList>
                                                        <CommandEmpty>No customer found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {customers.map((customer) => {
                                                                const displayName = customer.companyName || customer.contactPerson;
                                                                return (
                                                                    <CommandItem
                                                                        value={displayName}
                                                                        key={customer.id}
                                                                        onSelect={() => {
                                                                            form.setValue("customerId", customer.id);
                                                                            form.setValue("customerName", displayName);
                                                                            setCustomerSearchOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                customer.id === field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {displayName}
                                                                    </CommandItem>
                                                                );
                                                            })}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Payment Date */}
                            <FormField
                                control={form.control}
                                name="paymentDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-sm font-semibold">DATE</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "pl-3 text-left font-normal h-10 bg-background",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "MM/dd/yyyy")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Customer Balance */}
                            <div className="flex flex-col items-end">
                                <Label className="text-sm font-semibold mb-2">CUSTOMER BALANCE</Label>
                                <Badge variant="secondary" className="text-lg px-4 py-2 font-bold">
                                    {formatCurrency(customerBalance)}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Amount and Method Section */}
                <Card>
                    <CardContent className="pt-6 space-y-6">
                        {/* Payment Amount */}
                        <FormField
                            control={form.control}
                            name="totalAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base font-semibold">Payment Amount</FormLabel>
                                    <FormControl>
                                        <NumberInput
                                            placeholder="0.00"
                                            value={field.value}
                                            onChange={(val) => {
                                                field.onChange(val);
                                            }}
                                            className="text-2xl h-14 font-semibold"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Payment Method - Visual Buttons */}
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base font-semibold">Payment Method</FormLabel>
                                    <FormControl>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {paymentMethods.map((method) => {
                                                const Icon = method.icon;
                                                const isSelected = field.value === method.value;
                                                return (
                                                    <Button
                                                        key={method.value}
                                                        type="button"
                                                        variant={isSelected ? "default" : "outline"}
                                                        className={cn(
                                                            "h-20 flex flex-col gap-2",
                                                            isSelected && "ring-2 ring-primary"
                                                        )}
                                                        onClick={() => field.onChange(method.value)}
                                                    >
                                                        <Icon className="h-6 w-6" />
                                                        <span className="text-sm">{method.label}</span>
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Reference Number and Check Number */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="referenceNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reference No.</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Transaction ID, Ref #" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.watch('paymentMethod') === 'Check' && (
                                <FormField
                                    control={form.control}
                                    name="checkNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Check No.</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Check number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        {/* Auto-Allocate Button */}
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={autoAllocate}
                                disabled={!selectedCustomerId || totalPaymentAmount === 0}
                            >
                                Auto-Allocate Payment
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Allocation Table - QuickBooks Style */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Outstanding Invoices</CardTitle>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-primary"
                        >
                            <HelpCircle className="h-4 w-4 mr-1" />
                            Where does this payment go?
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Invoice Number</TableHead>
                                        <TableHead className="text-right">Original Amt</TableHead>
                                        <TableHead className="text-right">Amount Due</TableHead>
                                        <TableHead className="text-right w-[200px]">Payment</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center">
                                                {arLoading ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Loading invoices...
                                                    </div>
                                                ) : selectedCustomerId ? (
                                                    "No unpaid invoices found for this customer."
                                                ) : (
                                                    "Select a customer to view invoices."
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        fields.map((field, index) => {
                                            const allocationItem = form.getValues(`allocations.${index}`);
                                            const arRecord = arRecords?.find((ar: any) => ar.id === field.arId);
                                            return (
                                                <TableRow
                                                    key={field.id}
                                                    className={cn(
                                                        allocationItem?.isSelected && "bg-accent/50"
                                                    )}
                                                >
                                                    <TableCell>
                                                        <FormField
                                                            control={form.control}
                                                            name={`allocations.${index}.isSelected`}
                                                            render={({ field }) => (
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={(checked) => {
                                                                        field.onChange(checked);
                                                                        if (!checked) {
                                                                            form.setValue(`allocations.${index}.amount`, 0);
                                                                        } else {
                                                                            const currentTotal = totalPaymentAmount;
                                                                            const currentAllocations = watchedAllocations || [];
                                                                            const currentAllocated = currentAllocations
                                                                                .reduce((sum, item, idx) => idx !== index && item.isSelected ? sum + item.amount : sum, 0);
                                                                            const remaining = Math.max(0, currentTotal - currentAllocated);
                                                                            const balance = currentAllocations[index].balance;
                                                                            form.setValue(`allocations.${index}.amount`, Math.min(remaining, balance));
                                                                        }
                                                                    }}
                                                                />
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {arRecord?.dueDate ? format(new Date(arRecord.dueDate), 'MM/dd/yyyy') : '-'}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {field.salesOrderId || 'No Reference'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(arRecord?.totalAmount ? Number(arRecord.totalAmount) : 0)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {formatCurrency(field.balance)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <FormField
                                                            control={form.control}
                                                            name={`allocations.${index}.amount`}
                                                            render={({ field }) => (
                                                                <NumberInput
                                                                    value={field.value}
                                                                    onChange={(val) => {
                                                                        field.onChange(val);
                                                                    }}
                                                                    max={allocationItem?.balance}
                                                                    className="text-right h-9"
                                                                    disabled={!allocationItem?.isSelected}
                                                                />
                                                            )}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Fields - Collapsible */}
                <Card>
                    <CardHeader
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setShowAdditionalFields(!showAdditionalFields)}
                    >
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Additional Fields</CardTitle>
                            {showAdditionalFields ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                    </CardHeader>
                    {showAdditionalFields && (
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="invoiceNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Invoice Number from Customer</FormLabel>
                                        <FormControl>
                                            <Input placeholder="INV-12345" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="withholdingTax"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Withholding Tax</FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    placeholder="0.00"
                                                    value={field.value || 0}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="salesDiscount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sales Discount</FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    placeholder="0.00"
                                                    value={field.value || 0}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="rebates"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rebates</FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    placeholder="0.00"
                                                    value={field.value || 0}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="taxExemption"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tax Exemption</FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    placeholder="0.00"
                                                    value={field.value || 0}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Payment Summary Section */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left: Underpayment Options */}
                            <div className="space-y-4">
                                <Label className="text-base font-semibold">Underpayment</Label>
                                <FormField
                                    control={form.control}
                                    name="underpaymentOption"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    className="space-y-2"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="leave" id="leave" />
                                                        <Label htmlFor="leave" className="font-normal cursor-pointer">
                                                            Leave as an underpayment
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="writeoff" id="writeoff" />
                                                        <Label htmlFor="writeoff" className="font-normal cursor-pointer">
                                                            Write off the extra amount
                                                        </Label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Right: Payment Summary */}
                            <div className="space-y-3 border-l pl-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Amount to Apply:</span>
                                    <span className="font-semibold">{formatCurrency(currentAllocatedTotal)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Amount to Credit:</span>
                                    <span className="font-semibold">
                                        {formatCurrency(Math.max(0, totalPaymentAmount - currentAllocatedTotal))}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Discount and Credits Applied:</span>
                                    <span className="font-semibold">{formatCurrency(0)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-base font-bold">Total Payment:</span>
                                    <span className="text-xl font-bold text-primary">
                                        {formatCurrency(totalPaymentAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={form.formState.isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                        disabled={form.formState.isSubmitting}
                    >
                        Clear
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting || Math.abs(totalPaymentAmount - currentAllocatedTotal) > 0.01}
                    >
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save & Close
                    </Button>
                </div>
            </form>
        </Form>
    );
}
