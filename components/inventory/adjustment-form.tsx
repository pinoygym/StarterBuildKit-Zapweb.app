'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { Warehouse, Branch } from '@prisma/client';
import { ProductWithUOMs } from '@/types/product.types';
import { InventoryAdjustmentWithRelations } from '@/types/inventory-adjustment.types';

const adjustmentItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().min(0, 'Quantity cannot be negative'),
    uom: z.string().min(1, 'UOM is required'),
    type: z.enum(['ABSOLUTE', 'RELATIVE'], {
        required_error: 'Adjustment type is required',
    }),
});

const adjustmentFormSchema = z.object({
    warehouseId: z.string().min(1, 'Warehouse is required'),
    branchId: z.string().min(1, 'Branch is required'),
    reason: z.string().min(1, 'Reason is required'),
    adjustmentDate: z.date({
        required_error: 'Adjustment date is required',
    }),
    referenceNumber: z.string().optional(),
    items: z
        .array(adjustmentItemSchema)
        .min(1, 'At least one item is required'),
});

export type AdjustmentFormData = z.infer<typeof adjustmentFormSchema>;

interface AdjustmentFormProps {
    initialData?: InventoryAdjustmentWithRelations;
    warehouses: Warehouse[];
    branches: Branch[];
    products: ProductWithUOMs[];
    onSubmit: (data: AdjustmentFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export function AdjustmentForm({
    initialData,
    warehouses,
    branches,
    products,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: AdjustmentFormProps) {
    // Keep track of selected products locally
    const [selectedProductsMap, setSelectedProductsMap] = useState<Record<string, ProductWithUOMs>>({});

    const defaultValues = useMemo(() => {
        if (!initialData) {
            return {
                warehouseId: '',
                branchId: '',
                reason: '',
                adjustmentDate: new Date(),
                referenceNumber: '',
                items: [{ productId: '', quantity: 0, uom: '', type: 'RELATIVE' as const }],
            };
        }

        return {
            warehouseId: initialData.warehouseId,
            branchId: initialData.branchId,
            reason: initialData.reason,
            adjustmentDate: new Date(initialData.adjustmentDate),
            referenceNumber: initialData.referenceNumber || '',
            items: initialData.items.map(item => ({
                productId: item.productId,
                quantity: Math.abs(item.quantity), // Form shows positive value, logic handles sign
                uom: item.uom,
                type: item.type as 'RELATIVE' | 'ABSOLUTE'
            }))
        };
    }, [initialData]);

    const form = useForm<AdjustmentFormData>({
        resolver: zodResolver(adjustmentFormSchema),
        defaultValues,
    });

    // Reset form when initialData changes
    useEffect(() => {
        form.reset(defaultValues);
    }, [initialData, defaultValues, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    // Merge passed products with locally stored selected products
    const allProducts = useMemo(() => {
        const productMap = new Map(products.map(p => [p.id, p]));

        // Add selected products not in the main list
        Object.values(selectedProductsMap).forEach(p => {
            if (!productMap.has(p.id)) {
                productMap.set(p.id, p);
            }
        });

        // Ensure products from initialData are available
        if (initialData) {
            initialData.items.forEach(item => {
                let product = productMap.get(item.productId);

                if (!product) {
                    // Create a synthetic product object from the available data
                    product = {
                        id: item.productId,
                        name: item.Product.name,
                        baseUOM: item.Product.baseUOM,
                        // Fill required fields with SAFE defaults/placeholders as we don't have full data
                        category: 'Uncategorized',
                        alternateUOMs: [],
                        basePrice: 0,
                        minStockLevel: 0,
                        shelfLifeDays: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        description: null,
                        imageUrl: null,
                        status: 'active'
                    };
                    productMap.set(item.productId, product);
                }

                // Check if the used UOM is available in the product
                const isBase = item.uom === product.baseUOM;
                const isAlternate = product.alternateUOMs.some(u => u.name === item.uom);

                if (!isBase && !isAlternate) {
                    // Add the missing UOM to the product to ensure it displays correctly in the Select
                    // We treat it as a synthetic UOM since we don't have the full details
                    const newUOM = {
                        id: `synthetic-uom-${item.id}`,
                        productId: product.id,
                        name: item.uom,
                        conversionFactor: 1,
                        sellingPrice: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        barcode: null,
                        sku: null
                    };

                    // Update the product in the map with the new UOM
                    // We clone the product to avoid mutating the original if it came from the props
                    productMap.set(item.productId, {
                        ...product,
                        alternateUOMs: [...product.alternateUOMs, newUOM]
                    });
                }
            });
        }

        return Array.from(productMap.values());
    }, [products, selectedProductsMap, initialData]);

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
        // If product is in `allProducts`, use its UOMs.
        // If it's from `initialData` but not in `allProducts` (e.g. not loaded in search list yet), 
        // we might only know `baseUOM` if we used that. 
        // For robust implementation, we should rely on `allProducts`.

        const product = allProducts.find((p) => p.id === productId);
        if (!product) {
            // Fallback for initial data where we might check `initialData.items`
            const initialItem = initialData?.items.find(i => i.productId === productId);
            if (initialItem) return [initialItem.uom]; // At least return the current one
            return [];
        }

        return [
            product.baseUOM,
            ...product.alternateUOMs.map((uom) => uom.name),
        ];
    };

    // Auto-select Branch if only one exists or based on user defaults (not implemented here but good to know)

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Adjustment Contact & Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <FormField
                                control={form.control}
                                name="branchId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Branch</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select branch" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {branches.map((branch) => (
                                                    <SelectItem key={branch.id} value={branch.id}>
                                                        {branch.name}
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
                        </div>

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
                    <CardContent className="space-y-2">
                        {fields.map((field, index) => {
                            const productId = form.getValues(`items.${index}.productId`);
                            const selectedUOM = form.getValues(`items.${index}.uom`);
                            const product = allProducts.find((p) => p.id === productId);

                            // Calculate conversion factor
                            let conversionFactor: number | null = null;
                            let conversionDisplay = '—';

                            if (product && selectedUOM) {
                                if (selectedUOM === product.baseUOM) {
                                    conversionDisplay = '—';
                                } else {
                                    const alternateUOM = product.alternateUOMs.find(u => u.name === selectedUOM);
                                    if (alternateUOM) {
                                        conversionFactor = alternateUOM.conversionFactor;
                                        conversionDisplay = `1 ${selectedUOM} = ${conversionFactor} ${product.baseUOM}`;
                                    }
                                }
                            }

                            return (
                                <div
                                    key={field.id}
                                    className={cn(
                                        "grid grid-cols-1 lg:grid-cols-[2fr_1.2fr_1fr_1fr_1.5fr_1fr_1fr_auto] gap-3 items-end p-3 rounded-md",
                                        index % 2 === 0 ? "bg-muted/30" : "bg-background"
                                    )}
                                >
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.productId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Product</FormLabel>
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

                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.type`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Type</FormLabel>
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
                                                        <SelectItem value="RELATIVE">Relative (+/-)</SelectItem>
                                                        <SelectItem value="ABSOLUTE">Absolute (Set to)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-2">
                                        <Label className="text-xs">Current Stock</Label>
                                        <Input
                                            readOnly
                                            value={initialData?.items.find(i => i.productId === field.productId)?.systemQuantity ?? '—'}
                                            className="bg-muted text-muted-foreground h-10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">Base UOM</Label>
                                        <Input
                                            readOnly
                                            value={product?.baseUOM ?? '—'}
                                            className="bg-muted text-muted-foreground h-10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">Conversion</Label>
                                        <Input
                                            readOnly
                                            value={conversionDisplay}
                                            className="bg-muted text-muted-foreground text-xs h-10"
                                            title={conversionDisplay}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Adjust Qty</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0"
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.uom`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">UOM</FormLabel>
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

                                    <div className="flex items-end justify-center pb-1">
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
                            )
                        })}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({ productId: '', quantity: 0, uom: '', type: 'RELATIVE' })}
                            className="mt-4"
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
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Adjustment
                    </Button>
                </div>
            </form>
        </Form>
    );
}
