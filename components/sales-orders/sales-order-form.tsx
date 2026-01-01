'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

import { z } from 'zod';
import { SalesOrderWithItems } from '@/types/sales-order.types';
import { Warehouse } from '@prisma/client';
import { Branch } from '@prisma/client';
import { ProductWithUOMs } from '@/types/product.types';
import { ProductSearchCombobox } from '@/components/shared/product-search-combobox';
import { cn } from '@/lib/utils';

// Re-defining the schema locally if it matches the dialog's usage, 
// or determining if we should export it from the validation file.
// The validation file has `salesOrderSchema` which is slightly different (uses enums etc).
// The dialog used a specific schema definition. I will adapt the schema from the dialog for now to ensure compatibility
// but ideally we should unify them. For this task, I will stick to what works for the UI.

const salesOrderItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().positive('Quantity must be greater than 0'),
    uom: z.string().min(1, 'UOM is required'),
    unitPrice: z.number().min(0, 'Unit price must be greater than or equal to 0'),
    subtotal: z.number().min(0, 'Subtotal must be greater than or equal to 0'),
});

const formSchema = z.object({
    customerName: z.string().min(1, 'Customer name is required'),
    customerPhone: z
        .string()
        .min(1, 'Customer phone is required')
        .regex(
            /^(\+63|0)?[0-9]{10}$/,
            'Invalid phone number format. Use format: 09XXXXXXXXX'
        ),
    customerEmail: z
        .string()
        .min(1, 'Customer email is required')
        .email('Invalid email format'),
    ciNumber: z.string().optional(),
    deliveryAddress: z.string().min(1, 'Delivery address is required'),
    warehouseId: z.string().min(1, 'Warehouse is required'),
    branchId: z.string().min(1, 'Branch is required'),
    deliveryDate: z.date({
        required_error: 'Delivery date is required',
    }),
    items: z
        .array(salesOrderItemSchema)
        .min(1, 'At least one item is required'),
});

type SalesOrderFormData = z.infer<typeof formSchema>;

interface SalesOrderFormProps {
    salesOrder?: SalesOrderWithItems | null;
    warehouses: Warehouse[];
    branches: Branch[];
    products: ProductWithUOMs[];
    onSubmit: (data: SalesOrderFormData) => Promise<boolean>;
    onCancel: () => void;
    activeBranchId?: string;
}

export function SalesOrderForm({
    salesOrder,
    warehouses,
    branches,
    products,
    onSubmit,
    onCancel,
    activeBranchId,
}: SalesOrderFormProps) {
    const isEditing = !!salesOrder;
    const [additionalProducts, setAdditionalProducts] = useState<ProductWithUOMs[]>([]);

    // Merge initial products with additionally fetched products (if we implement searching later that fetches dynamically)
    // For now, products prop likely contains all active products or pre-fetched ones.
    const allProducts = [...products, ...additionalProducts];

    const form = useForm<SalesOrderFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            customerName: '',
            customerPhone: '',
            customerEmail: '',
            deliveryAddress: '',
            ciNumber: '',
            warehouseId: '',
            branchId: activeBranchId || '',
            deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            items: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    useEffect(() => {
        if (salesOrder) {
            form.reset({
                customerName: salesOrder.customerName,
                customerPhone: salesOrder.customerPhone,
                customerEmail: salesOrder.customerEmail || '',
                deliveryAddress: salesOrder.deliveryAddress,
                ciNumber: salesOrder.ciNumber || '',
                warehouseId: salesOrder.warehouseId,
                branchId: salesOrder.branchId,
                deliveryDate: new Date(salesOrder.deliveryDate),
                items: salesOrder.items.map((item) => ({
                    productId: item.productId,
                    quantity: Number(item.quantity),
                    uom: item.uom,
                    unitPrice: Number(item.unitPrice),
                    subtotal: Number(item.subtotal),
                })),
            });
        }
    }, [salesOrder, form]);

    const handleProductChange = (index: number, productId: string) => {
        const product = allProducts.find((p) => p.id === productId);
        if (product) {
            // Set default UOM to base UOM
            form.setValue(`items.${index}.uom`, product.baseUOM);
            form.setValue(`items.${index}.unitPrice`, Number(product.basePrice));

            // Calculate subtotal
            const quantity = form.getValues(`items.${index}.quantity`);
            form.setValue(`items.${index}.subtotal`, quantity * Number(product.basePrice));
        }
    };

    const handleUOMChange = (index: number, uom: string) => {
        const productId = form.getValues(`items.${index}.productId`);
        const product = allProducts.find((p) => p.id === productId);

        if (product) {
            let price = Number(product.basePrice);

            // Check if it's an alternate UOM
            if (uom !== product.baseUOM) {
                const alternateUOM = product.alternateUOMs.find((u) => u.name === uom);
                if (alternateUOM) {
                    price = Number(alternateUOM.sellingPrice);
                }
            }

            form.setValue(`items.${index}.unitPrice`, price);

            // Recalculate subtotal
            const quantity = form.getValues(`items.${index}.quantity`);
            form.setValue(`items.${index}.subtotal`, quantity * price);
        }
    };

    const handleQuantityChange = (index: number, quantity: number) => {
        const unitPrice = form.getValues(`items.${index}.unitPrice`);
        form.setValue(`items.${index}.subtotal`, quantity * unitPrice);
    };

    const calculateTotal = () => {
        const items = form.watch('items');
        return items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const getProductUOMs = (productId: string) => {
        const product = allProducts.find((p) => p.id === productId);
        if (!product) return [];

        return [
            { name: product.baseUOM, price: Number(product.basePrice) },
            ...product.alternateUOMs.map((uom) => ({
                name: uom.name,
                price: Number(uom.sellingPrice),
            })),
        ];
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sales Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="customerName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="customerPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="09XXXXXXXXX" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="customerEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="customer@example.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="ciNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CI Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Optional CI Reference" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="deliveryAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Delivery Address</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter full delivery address"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                name="deliveryDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Delivery Date</FormLabel>
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
                                                    disabled={(date) =>
                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Items</CardTitle>
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
                                                        onSelect={(product) => {
                                                            if (!allProducts.some(p => p.id === product.id)) {
                                                                setAdditionalProducts(prev => [...prev, product]);
                                                            }
                                                        }}
                                                        selectedProduct={allProducts.find(p => p.id === field.value)}
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
                                                        min={1}
                                                        step={1}
                                                        placeholder="0"
                                                        value={field.value}
                                                        onChange={(value) => {
                                                            field.onChange(value);
                                                            if (value) {
                                                                handleQuantityChange(index, value);
                                                            }
                                                        }}
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
                                        name={`items.${index}.uom`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>UOM</FormLabel>
                                                <Select
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        handleUOMChange(index, value);
                                                    }}
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
                                                            <SelectItem key={uom.name} value={uom.name}>
                                                                {uom.name} (₱{uom.price.toFixed(2)})
                                                            </SelectItem>
                                                        ))}
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
                                        name={`items.${index}.unitPrice`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Unit Price</FormLabel>
                                                <FormControl>
                                                    <NumberInput
                                                        min={0}
                                                        step={0.01}
                                                        placeholder="0.00"
                                                        decimalPlaces={2}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        disabled
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2 flex flex-col justify-between h-full">
                                    <div className="mb-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Subtotal</label>
                                        <div className="text-lg font-semibold mt-2">
                                            {formatCurrency(form.watch(`items.${index}.subtotal`) || 0)}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => remove(index)}
                                        className="text-destructive hover:text-destructive self-end"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({
                                productId: '',
                                quantity: 1,
                                uom: '',
                                unitPrice: 0,
                                subtotal: 0,
                            })}
                            className="active:scale-95 transition-transform"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>

                        <div className="flex justify-end pt-4 border-t">
                            <div className="text-right">
                                <div className="text-sm text-muted-foreground">Total Amount</div>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(calculateTotal())}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="active:scale-95 transition-transform"
                        disabled={form.formState.isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="active:scale-95 transition-transform"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Update Sales Order' : 'Create Sales Order'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
