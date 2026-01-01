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

const adjustmentItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().min(0, 'Quantity cannot be negative'),
    uom: z.string().min(1, 'UOM is required'),
    adjustmentType: z.enum(['ABSOLUTE', 'RELATIVE'], {
        required_error: 'Adjustment type is required',
    }),
});

const adjustmentFormSchema = z.object({
    warehouseId: z.string().min(1, 'Warehouse is required'),
    reason: z.string().min(1, 'Reason is required'),
    adjustmentDate: z.date({
        required_error: 'Adjustment date is required',
    }),
    referenceNumber: z.string().optional(),
    items: z
        .array(adjustmentItemSchema)
        .min(1, 'At least one item is required'),
});

type AdjustmentFormData = z.infer<typeof adjustmentFormSchema>;

interface AdjustmentSlipFormProps {
    warehouses: Warehouse[];
    products: ProductWithUOMs[];
    onSubmit: (data: AdjustmentFormData) => Promise<boolean>;
    onCancel: () => void;
}

export function AdjustmentSlipForm({
    warehouses,
    products,
    onSubmit,
    onCancel,
}: AdjustmentSlipFormProps) {
    // Keep track of selected products locally
    const [selectedProductsMap, setSelectedProductsMap] = useState<Record<string, ProductWithUOMs>>({});

    const form = useForm<AdjustmentFormData>({
        resolver: zodResolver(adjustmentFormSchema),
        defaultValues: {
            warehouseId: '',
            reason: '',
            adjustmentDate: new Date(),
            referenceNumber: '',
            items: [{ productId: '', quantity: 0, uom: '', adjustmentType: 'ABSOLUTE' }],
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
                        <CardTitle>Adjustment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="warehouseId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Warehouse</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select warehouse" />
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
                                name="adjustmentDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Adjustment Date</FormLabel>
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
                        </div>

                        <FormField
                            control={form.control}
                            name="referenceNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reference Number (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. ADJ-2024-001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Enter reason for adjustment (e.g., Physical count correction, Damage, Expiry)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Items to Adjust</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b pb-4 mb-4">
                                <div className="col-span-1 md:col-span-4">
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
                                        name={`items.${index}.adjustmentType`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="ABSOLUTE">Set To</SelectItem>
                                                        <SelectItem value="RELATIVE">Add/Subtract</SelectItem>
                                                    </SelectContent>
                                                </Select>
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
                                                        min={0}
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
                            onClick={() => append({ productId: '', quantity: 0, uom: '', adjustmentType: 'ABSOLUTE' })}
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
                        Submit Adjustment
                    </Button>
                </div>
            </form>
        </Form>
    );
}
