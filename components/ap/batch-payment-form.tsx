'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Search, Check } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, formatCurrency } from '@/lib/utils';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useAP } from '@/hooks/use-ap';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

const batchPaymentSchema = z.object({
    supplierId: z.string().min(1, 'Supplier is required'),
    supplierName: z.string(),
    totalAmount: z.number().positive('Payment amount must be greater than 0'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    referenceNumber: z.string().optional(),
    invoiceNumber: z.string().optional(),
    withholdingTax: z.number().optional(),
    salesDiscount: z.number().optional(),
    rebates: z.number().optional(),
    taxExemption: z.number().optional(),
    paymentDate: z.date({
        required_error: 'Payment date is required',
    }),
    allocations: z.array(z.object({
        apId: z.string(),
        purchaseOrderId: z.string().nullable(),
        createdAt: z.date(),
        supplierName: z.string(),
        referenceNumber: z.string().nullable(),
        amount: z.number().min(0),
        balance: z.number(),
        isSelected: z.boolean().default(false),
    })),
}).refine((data) => {
    const allocated = data.allocations.reduce((sum, item) => sum + (item.isSelected ? item.amount : 0), 0);
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

export function APBatchPaymentForm({ onSubmit, onCancel }: BatchPaymentFormProps) {
    const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);

    const { data: suppliers } = useSuppliers({ status: 'active' });

    const form = useForm<BatchPaymentFormData>({
        resolver: zodResolver(batchPaymentSchema),
        defaultValues: {
            supplierId: '',
            supplierName: '',
            totalAmount: 0,
            paymentMethod: 'Check',
            referenceNumber: '',
            invoiceNumber: '',
            withholdingTax: 0,
            salesDiscount: 0,
            rebates: 0,
            taxExemption: 0,
            paymentDate: new Date(),
            allocations: [],
        },
    });

    // Use useWatch instead of form.watch() to optimize subscriptions
    const selectedSupplierId = useWatch({
        control: form.control,
        name: 'supplierId',
    });
    const totalPaymentAmount = useWatch({
        control: form.control,
        name: 'totalAmount',
    });
    const watchedAllocations = useWatch({
        control: form.control,
        name: 'allocations',
    });

    // Fetch pending APs for selected supplier
    const { records: apRecords, loading: apLoading } = useAP(
        selectedSupplierId ? {
            supplierId: selectedSupplierId,
            status: 'pending' // pending or partial
        } : undefined
    );

    const { fields, replace } = useFieldArray({
        control: form.control,
        name: 'allocations',
    });

    // Populate allocations when supplier changes
    useEffect(() => {
        // Clear allocations when supplier changes
        if (!selectedSupplierId) {
            replace([]);
            return;
        }

        // Wait for AP records to load
        if (apLoading) {
            return;
        }

        // Populate allocations from AP records
        if (apRecords && apRecords.length > 0) {
            const newAllocations = apRecords
                .filter(ap => ap.status !== 'paid' && Number(ap.balance) > 0)
                .map(ap => ({
                    apId: ap.id,
                    purchaseOrderId: ap.purchaseOrderId,
                    createdAt: new Date(ap.createdAt),
                    supplierName: ap.supplier?.companyName || ap.supplier?.contactPerson || 'Unknown',
                    referenceNumber: ap.purchaseOrderId,
                    amount: 0,
                    balance: Number(ap.balance),
                    isSelected: false,
                }));
            replace(newAllocations);
        } else {
            replace([]);
        }
    }, [selectedSupplierId, apLoading]);

    // Handle total amount change to auto-allocate
    const autoAllocate = () => {
        const total = form.getValues('totalAmount');
        let remaining = total;

        // Get current allocations
        const currentAllocations = form.getValues('allocations');

        // For now, we allocate top-down (oldest first implicitly if sorted by date)
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Payment Details */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="supplierId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Supplier</FormLabel>
                                            <Popover open={supplierSearchOpen} onOpenChange={setSupplierSearchOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "justify-between",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? (() => {
                                                                    const s = suppliers.find(s => s.id === field.value);
                                                                    return s ? (s.companyName || s.contactPerson) : "Select supplier";
                                                                })()
                                                                : "Select supplier"}
                                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search supplier..." />
                                                        <CommandList>
                                                            <CommandEmpty>No supplier found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {suppliers.map((supplier) => {
                                                                    const displayName = supplier.companyName || supplier.contactPerson;
                                                                    return (
                                                                        <CommandItem
                                                                            value={displayName}
                                                                            key={supplier.id}
                                                                            onSelect={() => {
                                                                                form.setValue("supplierId", supplier.id);
                                                                                form.setValue("supplierName", displayName);
                                                                                setSupplierSearchOpen(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    supplier.id === field.value
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

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="totalAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Total Amount</FormLabel>
                                                <FormControl>
                                                    <NumberInput
                                                        placeholder="0.00"
                                                        value={field.value}
                                                        onChange={(val) => {
                                                            field.onChange(val);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex items-end pb-2">
                                        <Button type="button" variant="secondary" size="sm" onClick={autoAllocate}>
                                            Auto-Allocate
                                        </Button>
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Method</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select method" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Cash">Cash</SelectItem>
                                                    <SelectItem value="Check">Check</SelectItem>
                                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                                                    <SelectItem value="GCash">GCash</SelectItem>
                                                    <SelectItem value="PayMaya">PayMaya</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="referenceNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reference No. (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Check #, Ref #" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="paymentDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Payment Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
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

                                <FormField
                                    control={form.control}
                                    name="invoiceNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Invoice Number from Supplier</FormLabel>
                                            <FormControl>
                                                <Input placeholder="INV-12345" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
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
                                                <FormLabel>Purchase Discount</FormLabel>
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

                                <div className="grid grid-cols-2 gap-4">
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

                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">Total Input:</span>
                                        <span className="font-bold">{formatCurrency(totalPaymentAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">Allocated:</span>
                                        <span className={cn(
                                            "font-bold",
                                            Math.abs(totalPaymentAmount - currentAllocatedTotal) > 0.01 ? "text-destructive" : "text-green-600"
                                        )}>
                                            {formatCurrency(currentAllocatedTotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Remaining:</span>
                                        <span className="font-mono text-sm">
                                            {formatCurrency(totalPaymentAmount - currentAllocatedTotal)}
                                        </span>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Invoice Allocation */}
                    <div className="lg:col-span-2">
                        <Card className="h-full flex flex-col">
                            <CardHeader>
                                <CardTitle>Allocate to Payable</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto">
                                <div className="rounded-md border">
                                    <div className="grid grid-cols-24 gap-2 p-4 font-medium bg-muted text-sm">
                                        <div className="col-span-1">Select</div>
                                        <div className="col-span-3">Date</div>
                                        <div className="col-span-4">Supplier</div>
                                        <div className="col-span-4">PO / Reference</div>
                                        <div className="col-span-3 text-right">Balance</div>
                                        <div className="col-span-4 text-right">Payment Amount</div>
                                    </div>

                                    {fields.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            {apLoading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading payables...
                                                </div>
                                            ) : selectedSupplierId ? (
                                                "No unpaid payables found for this supplier."
                                            ) : (
                                                "Select a supplier to view payables."
                                            )}
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {fields.map((field, index) => (
                                                <div key={field.id} className={cn(
                                                    "grid grid-cols-24 gap-2 p-4 items-center text-sm",
                                                    watchedAllocations?.[index]?.isSelected ? "bg-accent/50" : ""
                                                )}>
                                                    <div className="col-span-1">
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
                                                                            const balance = currentAllocations[index]?.balance || 0;
                                                                            form.setValue(`allocations.${index}.amount`, Math.min(remaining, balance));
                                                                        }
                                                                    }}
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="col-span-3 text-xs text-muted-foreground">
                                                        {format(new Date(field.createdAt), 'MMM dd, yyyy')}
                                                    </div>
                                                    <div className="col-span-4 text-xs">
                                                        {field.supplierName}
                                                    </div>
                                                    <div className="col-span-4 flex flex-col">
                                                        <span className="font-medium text-xs">{field.purchaseOrderId || 'No PO Reference'}</span>
                                                        <span className="text-xs text-muted-foreground text-ellipsis overflow-hidden">
                                                            {field.apId.substring(0, 8)}...
                                                        </span>
                                                    </div>
                                                    <div className="col-span-3 text-right text-xs">
                                                        {formatCurrency(field.balance)}
                                                    </div>
                                                    <div className="col-span-4">
                                                        <FormField
                                                            control={form.control}
                                                            name={`allocations.${index}.amount`}
                                                            render={({ field }) => (
                                                                <NumberInput
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    max={watchedAllocations?.[index]?.balance}
                                                                    className="text-right h-8"
                                                                    disabled={!watchedAllocations?.[index]?.isSelected}
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={form.formState.isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting || Math.abs(totalPaymentAmount - currentAllocatedTotal) > 0.01}
                    >
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Batch Payment
                    </Button>
                </div>
            </form>
        </Form>
    );
}
