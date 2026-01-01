'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2 } from 'lucide-react';
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
import { purchaseOrderSchema, PurchaseOrderFormData } from '@/lib/validations/purchase-order.validation';
import { PurchaseOrderWithDetails } from '@/types/purchase-order.types';
import { Supplier } from '@prisma/client';
import { Warehouse } from '@prisma/client';
import { Branch } from '@prisma/client';
import { ProductWithUOMs } from '@/types/product.types';
import { ProductSearchCombobox } from '@/components/shared/product-search-combobox';

interface PurchaseOrderFormProps {
  purchaseOrder?: PurchaseOrderWithDetails | null;
  suppliers: Supplier[];
  warehouses: Warehouse[];
  branches: Branch[];
  products: ProductWithUOMs[];
  onSubmit: (data: PurchaseOrderFormData) => Promise<any>;
  onCancel: () => void;
  isCopy?: boolean;
}

export function PurchaseOrderForm({
  purchaseOrder,
  suppliers,
  warehouses,
  branches,
  products,
  onSubmit,
  onCancel,
  isCopy = false,
}: PurchaseOrderFormProps) {
  const isEditing = !!purchaseOrder && !isCopy;
  const [averageCosts, setAverageCosts] = useState<Record<string, Record<string, number>>>({});
  const [additionalProducts, setAdditionalProducts] = useState<ProductWithUOMs[]>([]);

  // Merge initial products with additionally fetched products
  const allProducts = [...products, ...additionalProducts];

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: '',
      warehouseId: '',
      branchId: '',
      expectedDeliveryDate: new Date(),
      notes: '',
      items: [{ productId: '', quantity: 1, uom: '', unitPrice: 0 }],
      taxAmount: 0,
      discountAmount: 0,
      otherCharges: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const getAvailableUOMs = useCallback((productId: string) => {
    // Check in both initial list and additional list
    const product = allProducts.find(p => p.id === productId);
    if (!product) return [];

    const uoms = [{ name: product.baseUOM, conversionFactor: 1 }];
    uoms.push(...product.alternateUOMs.map(u => ({
      name: u.name,
      conversionFactor: Number(u.conversionFactor)
    })));
    return uoms;
  }, [allProducts]);

  const loadAverageCosts = useCallback(async (productId: string, warehouseId: string) => {
    if (!productId || !warehouseId) return;

    try {
      const uoms = getAvailableUOMs(productId);
      const costs: Record<string, number> = {};

      for (const uom of uoms) {
        try {
          const response = await fetch(`/api/inventory/average-cost?productId=${productId}&warehouseId=${warehouseId}&uom=${uom.name}`);
          const result = await response.json();

          if (result.success) {
            costs[uom.name] = result.data;
          } else {
            costs[uom.name] = 0;
          }
        } catch (error) {
          // If no inventory data, set to 0
          costs[uom.name] = 0;
        }
      }

      setAverageCosts(prev => ({
        ...prev,
        [`${productId}-${warehouseId}`]: costs
      }));
    } catch (error) {
      console.error('Failed to load average costs:', error);
    }
  }, [getAvailableUOMs]);

  useEffect(() => {
    if (purchaseOrder) {
      form.reset({
        supplierId: purchaseOrder.supplierId,
        warehouseId: purchaseOrder.warehouseId,
        branchId: purchaseOrder.branchId,
        expectedDeliveryDate: isCopy ? new Date() : new Date(purchaseOrder.expectedDeliveryDate),
        notes: purchaseOrder.notes || '',
        items: purchaseOrder.PurchaseOrderItem.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          uom: item.uom,
          unitPrice: Number(item.unitPrice),
        })),
        taxAmount: purchaseOrder.taxAmount || 0,
        discountAmount: purchaseOrder.discountAmount || 0,
        otherCharges: purchaseOrder.otherCharges || 0,
      });
    }
  }, [purchaseOrder, form, isCopy]);

  // Load average costs when warehouse or product changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Handle warehouse change - reload all products
      if (name === 'warehouseId' && value.warehouseId) {
        value.items?.forEach((item) => {
          if (item && item.productId) {
            loadAverageCosts(item.productId, value.warehouseId!);
          }
        });
      }

      // Handle product change - load costs for that specific product
      if (name?.startsWith('items.') && name?.endsWith('.productId')) {
        const index = parseInt(name.split('.')[1]);
        const productId = value.items?.[index]?.productId;
        const warehouseId = value.warehouseId;

        if (productId && warehouseId) {
          loadAverageCosts(productId, warehouseId);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, loadAverageCosts]);

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    await onSubmit(data);
  };

  const calculateItemSubtotal = (index: number) => {
    const item = form.watch(`items.${index}`);
    return (item.quantity || 0) * (item.unitPrice || 0);
  };

  const calculateTotal = () => {
    const items = form.watch('items');
    const taxAmount = form.watch('taxAmount') || 0;
    const discountAmount = form.watch('discountAmount') || 0;
    const otherCharges = form.watch('otherCharges') || 0;

    const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
    return subtotal + taxAmount - discountAmount + otherCharges;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };



  const getAverageCost = (productId: string, warehouseId: string, uom: string) => {
    const key = `${productId}-${warehouseId}`;
    return averageCosts[key]?.[uom] || 0;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.filter(s => s.status === 'active').map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.companyName}
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
                    <FormLabel>Warehouse *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.filter(b => b.status === 'active').map((branch) => (
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
                name="expectedDeliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Delivery Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes or special instructions..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start border-b pb-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product *</FormLabel>
                        <FormControl>
                          <ProductSearchCombobox
                            products={products}
                            value={field.value}
                            onValueChange={field.onChange}
                            onSelect={(product) => {
                              // Add to additional products if not already present
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

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity *</FormLabel>
                        <FormControl>
                          <NumberInput
                            min={1}
                            step={1}
                            placeholder="0"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.uom`}
                    render={({ field }) => {
                      const productId = form.watch(`items.${index}.productId`);
                      const warehouseId = form.watch('warehouseId');
                      const availableUOMs = getAvailableUOMs(productId);

                      return (
                        <FormItem>
                          <FormLabel>UOM *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Auto-populate unit price with average cost
                              const avgCost = getAverageCost(productId, warehouseId, value);
                              if (avgCost > 0) {
                                // Round to 2 decimal places
                                form.setValue(`items.${index}.unitPrice`, Math.round(avgCost * 100) / 100);
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select UOM" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableUOMs.map((uom) => {
                                const avgCost = getAverageCost(productId, warehouseId, uom.name);
                                return (
                                  <SelectItem key={uom.name} value={uom.name}>
                                    {uom.name} (Avg: {formatCurrency(avgCost)})
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price *</FormLabel>
                        <FormControl>
                          <NumberInput
                            min={0}
                            step={0.01}
                            placeholder="0.00"
                            decimalPlaces={2}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Subtotal</label>
                    <div className="text-lg font-semibold mt-2">
                      {formatCurrency(calculateItemSubtotal(index))}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className="mt-8 active:scale-95 transition-transform"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ productId: '', quantity: 1, uom: '', unitPrice: 0 })}
              className="active:scale-95 transition-transform"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>

            <div className="flex flex-col gap-4 border-t pt-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Amount</FormLabel>
                      <FormControl>
                        <NumberInput
                          placeholder="0.00"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Amount</FormLabel>
                      <FormControl>
                        <NumberInput
                          placeholder="0.00"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="otherCharges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Charges (+/-)</FormLabel>
                      <FormControl>
                        <NumberInput
                          placeholder="0.00"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <div className="text-right space-y-1">
                <div className="text-sm text-muted-foreground flex justify-between gap-8">
                  <span>Subtotal:</span>
                  <span>
                    {formatCurrency(
                      form.watch('items').reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0)
                    )}
                  </span>
                </div>
                {form.watch('taxAmount')! > 0 && (
                  <div className="text-sm text-muted-foreground flex justify-between gap-8">
                    <span>Tax:</span>
                    <span>{formatCurrency(form.watch('taxAmount') || 0)}</span>
                  </div>
                )}
                {form.watch('discountAmount')! > 0 && (
                  <div className="text-sm text-green-600 flex justify-between gap-8">
                    <span>Discount:</span>
                    <span>-{formatCurrency(form.watch('discountAmount') || 0)}</span>
                  </div>
                )}
                {form.watch('otherCharges') !== 0 && (
                  <div className="text-sm text-muted-foreground flex justify-between gap-8">
                    <span>Other Charges:</span>
                    <span>{formatCurrency(form.watch('otherCharges') || 0)}</span>
                  </div>
                )}

                <div className="text-xl font-bold border-t pt-2 mt-2 flex justify-between gap-8">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
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
            {isEditing ? 'Update Purchase Order' : 'Create Purchase Order'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
