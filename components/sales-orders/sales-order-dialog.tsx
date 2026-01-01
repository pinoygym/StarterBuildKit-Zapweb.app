'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { SalesOrderWithItems } from '@/types/sales-order.types';
import { useProducts } from '@/hooks/use-products';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useBranch } from '@/hooks/use-branch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const salesOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'UOM is required'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  subtotal: z.number().positive('Subtotal must be greater than 0'),
});

const salesOrderFormSchema = z.object({
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

type SalesOrderFormData = z.infer<typeof salesOrderFormSchema>;

interface SalesOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder?: SalesOrderWithItems | null;
  onSave: (id: string | undefined, data: any) => Promise<boolean>;
}

export function SalesOrderDialog({
  open,
  onOpenChange,
  salesOrder,
  onSave,
}: SalesOrderDialogProps) {
  const { toast } = useToast();
  const isEditing = !!salesOrder;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { products } = useProducts({ status: 'active' });
  const { warehouses } = useWarehouses();
  const { activeBranch, branches } = useBranch();

  const form = useForm<SalesOrderFormData>({
    resolver: zodResolver(salesOrderFormSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      deliveryAddress: '',
      warehouseId: '',
      branchId: activeBranch?.id || '',
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
        customerEmail: salesOrder.customerEmail,
        deliveryAddress: salesOrder.deliveryAddress,
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
    } else {
      form.reset({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        deliveryAddress: '',
        warehouseId: '',
        branchId: activeBranch?.id || '',
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        items: [],
      });
    }
  }, [salesOrder, activeBranch, form]);

  const handleAddItem = () => {
    append({
      productId: '',
      quantity: 1,
      uom: '',
      unitPrice: 0,
      subtotal: 0,
    });
  };

  const handleProductChange = async (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
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
    const product = products.find((p) => p.id === productId);
    
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
    const items = form.getValues('items');
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const onSubmit = async (data: SalesOrderFormData) => {
    try {
      setIsSubmitting(true);
      
      // Calculate total amount
      const totalAmount = calculateTotal();
      
      const payload = {
        ...data,
        totalAmount,
        status: isEditing ? undefined : 'draft',
      };
      
      const success = await onSave(salesOrder?.id, payload);
      
      if (success) {
        onOpenChange(false);
        form.reset();
      }
    } catch (error) {
      console.error('Error saving sales order:', error);
      toast({
        title: 'Error',
        description: 'Failed to save sales order',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProductUOMs = (productId: string) => {
    const product = products.find((p) => p.id === productId);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Sales Order' : 'Create Sales Order'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the sales order details'
              : 'Create a new customer order'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Customer Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Order Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Order Details</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                        defaultValue={field.value}
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
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Order Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No items added yet. Click &quot;Add Item&quot; to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-4 items-start p-4 border rounded-lg"
                    >
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleProductChange(index, value);
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  {...field}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    field.onChange(value);
                                    handleQuantityChange(index, value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2">
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
                                defaultValue={field.value}
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

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  disabled
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.subtotal`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subtotal</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  disabled
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 sm:col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              {fields.length > 0 && (
                <div className="flex justify-end">
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold">
                      Total: ₱{calculateTotal().toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Order'
                  : 'Create Order'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
