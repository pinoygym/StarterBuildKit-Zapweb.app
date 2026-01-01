'use client';

import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ProductSearchCombobox } from '@/components/shared/product-search-combobox';
import { cn } from '@/lib/utils';
import { Warehouse } from '@prisma/client';
import { ProductWithUOMs } from '@/types/product.types';
import { useStockLevel } from '@/hooks/use-stock-level';
import { OnHandQuantityDisplay } from '@/components/inventory/on-hand-quantity-display';

const transferItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().positive('Quantity must be greater than 0'),
    uom: z.string().min(1, 'UOM is required'),
});

const transferFormSchema = z.object({
    sourceWarehouseId: z.string().min(1, 'Source warehouse is required'),
    destinationWarehouseId: z.string().min(1, 'Destination warehouse is required'),
    branchId: z.string().min(1, 'Branch is required'),
    reason: z.string().optional(),
    transferDate: z.date({
        required_error: 'Transfer date is required',
    }),
    referenceNumber: z.string().optional(),
    items: z
        .array(transferItemSchema)
        .min(1, 'At least one item is required'),
}).refine(
    (data) => data.sourceWarehouseId !== data.destinationWarehouseId,
    {
        message: 'Source and destination warehouses must be different',
        path: ['destinationWarehouseId'],
    }
);

export type TransferFormData = z.infer<typeof transferFormSchema>;

interface TransferSlipFormProps {
    warehouses: Warehouse[];
    products: ProductWithUOMs[];
    initialData?: Partial<TransferFormData>;
    onSubmit: (data: TransferFormData, isPost: boolean) => Promise<boolean>;
    onCancel: () => void;
    isEdit?: boolean;
    status?: string;
}

export function TransferSlipForm({
    warehouses,
    products,
    initialData,
    onSubmit,
    onCancel,
    isEdit = false,
    status = 'DRAFT',
}: TransferSlipFormProps) {
    const [selectedProductsMap, setSelectedProductsMap] = useState<Record<string, ProductWithUOMs>>({});
    const [isPosting, setIsPosting] = useState(false);

    const form = useForm<TransferFormData>({
        resolver: zodResolver(transferFormSchema),
        defaultValues: {
            sourceWarehouseId: initialData?.sourceWarehouseId || '',
            destinationWarehouseId: initialData?.destinationWarehouseId || '',
            branchId: initialData?.branchId || '',
            reason: initialData?.reason || '',
            transferDate: initialData?.transferDate ? new Date(initialData.transferDate) : new Date(),
            referenceNumber: initialData?.referenceNumber || '',
            items: initialData?.items || [{ productId: '', quantity: 1, uom: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    // Automatically set branchId when sourceWarehouse changes
    const sourceWarehouseId = form.watch('sourceWarehouseId');
    useMemo(() => {
        if (sourceWarehouseId) {
            const warehouse = warehouses.find(w => w.id === sourceWarehouseId);
            if (warehouse) {
                form.setValue('branchId', warehouse.branchId);
            }
        }
    }, [sourceWarehouseId, warehouses, form]);

    const allProducts = useMemo(() => {
        const productMap = new Map(products.map(p => [p.id, p]));
        Object.values(selectedProductsMap).forEach(p => {
            if (!productMap.has(p.id)) {
                productMap.set(p.id, p);
            }
        });
        return Array.from(productMap.values());
    }, [products, selectedProductsMap]);

    const handleProductChange = (index: number, productId: string) => {
        const product = allProducts.find((p) => p.id === productId);
        if (product) {
            form.setValue(`items.${index}.uom`, product.baseUOM);
        }
    };

    const handleProductSelect = (product: ProductWithUOMs) => {
        setSelectedProductsMap(prev => ({
            ...prev,
            [product.id]: product
        }));
    };

    const getProductUOMs = (productId: string) => {
        const product = allProducts.find((p) => p.id === productId);
        if (!product) return [];

        return [
            product.baseUOM,
            ...(product.alternateUOMs || []).map((uom) => uom.name),
        ];
    };

    const handleInternalSubmit = async (isPost: boolean) => {
        setIsPosting(isPost);

        // Filter out empty items
        const currentItems = form.getValues('items');
        const nonEmptyItems = currentItems.filter(item => item.productId);

        if (nonEmptyItems.length !== currentItems.length) {
            form.setValue('items', nonEmptyItems);
        }

        const isValid = await form.trigger();
        if (!isValid) {
            setIsPosting(false);
            return;
        }

        const data = form.getValues();
        await onSubmit(data, isPost);
    };

    const isReadOnly = status !== 'DRAFT';

    return (
        <Form {...form}>
            <form className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>Transfer Details</CardTitle>
                        {isEdit && (
                            <div className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                status === 'DRAFT' ? "bg-yellow-100 text-yellow-800" :
                                    status === 'POSTED' ? "bg-green-100 text-green-800" :
                                        "bg-gray-100 text-gray-800"
                            )}>
                                {status}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <FormField
                                control={form.control}
                                name="sourceWarehouseId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>From Warehouse</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={isReadOnly}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select source" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {warehouses.map((warehouse) => (
                                                    <SelectItem key={warehouse.id} value={warehouse.id}>
                                                        {warehouse.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="destinationWarehouseId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>To Warehouse</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={isReadOnly}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select destination" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {warehouses
                                                    .filter((w) => w.id !== form.watch('sourceWarehouseId'))
                                                    .map((warehouse) => (
                                                        <SelectItem key={warehouse.id} value={warehouse.id}>
                                                            {warehouse.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="transferDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Transfer Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild disabled={isReadOnly}>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'pl-3 text-left font-normal',
                                                            !field.value && 'text-muted-foreground'
                                                        )}
                                                        disabled={isReadOnly}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, 'PPP')
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
                                name="referenceNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reference Number (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. TR-2024-001" {...field} disabled={isReadOnly} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1">
                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Enter reason for transfer" {...field} disabled={isReadOnly} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Items to Transfer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => {
                            const productId = form.watch(`items.${index}.productId`);
                            const product = allProducts.find((p) => p.id === productId);
                            const baseUOM = product?.baseUOM;

                            return (
                                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b pb-4 mb-4">
                                    <div className="col-span-1 md:col-span-5">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.productId`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Product</FormLabel>
                                                    <FormControl>
                                                        <ProductSearchCombobox
                                                            products={allProducts}
                                                            value={field.value}
                                                            onValueChange={(value) => {
                                                                field.onChange(value);
                                                                handleProductChange(index, value);
                                                            }}
                                                            onSelect={handleProductSelect}
                                                            placeholder="Search product..."
                                                            disabled={isReadOnly}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quantity</FormLabel>
                                                    <FormControl>
                                                        <NumberInput
                                                            min={0.01}
                                                            step={0.01}
                                                            placeholder="0"
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            disabled={isReadOnly}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                On Hand
                                            </label>
                                            <div className="h-10 flex items-center px-3 py-2 border border-input bg-muted/50 rounded-md">
                                                <OnHandQuantityDisplay
                                                    productId={productId}
                                                    warehouseId={sourceWarehouseId}
                                                    baseUOM={baseUOM}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.uom`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>UOM</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={isReadOnly}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="UOM" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {getProductUOMs(
                                                                form.getValues(`items.${index}.productId`)
                                                            ).map((uom) => (
                                                                <SelectItem key={uom} value={uom}>
                                                                    {uom}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-1 flex items-end justify-center h-full pt-8">
                                        {!isReadOnly && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                disabled={fields.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {!isReadOnly && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ productId: '', quantity: 1, uom: '' })}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={form.formState.isSubmitting}
                    >
                        Cancel
                    </Button>

                    {!isReadOnly && (
                        <>
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={form.formState.isSubmitting}
                                onClick={() => handleInternalSubmit(false)}
                            >
                                {form.formState.isSubmitting && !isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save as Draft
                            </Button>
                            <Button
                                type="button"
                                disabled={form.formState.isSubmitting}
                                onClick={() => handleInternalSubmit(true)}
                            >
                                {form.formState.isSubmitting && isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Post Transfer
                            </Button>
                        </>
                    )}
                </div>
            </form>
        </Form>
    );
}
