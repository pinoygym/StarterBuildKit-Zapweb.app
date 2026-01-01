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

const transferItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().positive('Quantity must be greater than 0'),
    uom: z.string().min(1, 'UOM is required'),
});

const transferFormSchema = z.object({
    sourceWarehouseId: z.string().min(1, 'Source warehouse is required'),
    destinationWarehouseId: z.string().min(1, 'Destination warehouse is required'),
    reason: z.string().min(1, 'Reason is required'),
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

type TransferFormData = z.infer<typeof transferFormSchema>;

interface TransferSlipFormProps {
    warehouses: Warehouse[];
    products: ProductWithUOMs[];
    onSubmit: (data: TransferFormData) => Promise<boolean>;
    onCancel: () => void;
}

export function TransferSlipForm({
    warehouses,
    products,
    onSubmit,
    onCancel,
}: TransferSlipFormProps) {
    // Keep track of selected products locally to ensure they remain available
    // even if they are not in the initial products list (e.g. from search results)
    const [selectedProductsMap, setSelectedProductsMap] = useState<Record<string, ProductWithUOMs>>({});

    const form = useForm<TransferFormData>({
        resolver: zodResolver(transferFormSchema),
        defaultValues: {
            sourceWarehouseId: '',
            destinationWarehouseId: '',
            reason: '',
            transferDate: new Date(),
            referenceNumber: '',
            items: [{ productId: '', quantity: 1, uom: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    // Merge passed products with locally stored selected products
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
            ...product.alternateUOMs.map((uom) => uom.name),
        ];
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Transfer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="sourceWarehouseId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>From Warehouse</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
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
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'pl-3 text-left font-normal',
                                                            !field.value && 'text-muted-foreground'
                                                        )}
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
                                            <Input placeholder="e.g. TR-2024-001" {...field} />
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
                                            <Textarea placeholder="Enter reason for transfer" {...field} />
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
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b pb-4 mb-4">
                                <div className="col-span-1 md:col-span-6">
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
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-3">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.uom`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>UOM</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
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
                                </div>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({ productId: '', quantity: 1, uom: '' })}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
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
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Transfer
                    </Button>
                </div>
            </form>
        </Form>
    );
}
