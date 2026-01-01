'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductWithUOMs } from '@/types/product.types';
import { Plus, Trash2 } from 'lucide-react';
import { ImageUpload } from '@/components/products/image-upload';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { productSchema, ProductFormData } from '@/lib/validations/product.validation';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductWithUOMs | null;
  onSave: (id: string | undefined, data: ProductFormData) => Promise<any>;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSave,
}: ProductDialogProps) {
  const { toast } = useToast();
  const isEditing = !!product;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'Carbonated',
      imageUrl: '',
      basePrice: 0,
      baseUOM: 'bottle',
      minStockLevel: 10,
      shelfLifeDays: 365,
      status: 'active',
      alternateUOMs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'alternateUOMs',
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || '',
        category: product.category as any,
        imageUrl: product.imageUrl || '',
        basePrice: Number(product.basePrice),
        baseUOM: product.baseUOM,
        minStockLevel: product.minStockLevel,
        shelfLifeDays: product.shelfLifeDays,
        status: product.status as 'active' | 'inactive',
        alternateUOMs: product.alternateUOMs.map(uom => ({
          name: uom.name,
          conversionFactor: Number(uom.conversionFactor),
          sellingPrice: Number(uom.sellingPrice),
        })),
      });
    } else {
      form.reset({
        name: '',
        description: '',
        category: 'Carbonated',
        imageUrl: '',
        basePrice: 0,
        baseUOM: 'bottle',
        minStockLevel: 10,
        shelfLifeDays: 365,
        status: 'active',
        alternateUOMs: [],
      });
    }
  }, [product, form]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      const result = await onSave(product?.id, data);

      if (result.success) {
        toast({
          title: 'Success',
          description: `Product ${isEditing ? 'updated' : 'created'} successfully`,
        });
        onOpenChange(false);
        form.reset();
      } else {
        // Handle validation errors
        if (result.fields) {
          Object.entries(result.fields).forEach(([field, message]) => {
            form.setError(field as any, {
              type: 'manual',
              message: message as string,
            });
          });
        }
        
        toast({
          title: 'Error',
          description: result.error || `Failed to ${isEditing ? 'update' : 'create'} product`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} product`,
        variant: 'destructive',
      });
    }
  };

  const addAlternateUOM = () => {
    append({
      name: '',
      conversionFactor: 1,
      sellingPrice: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Create Product'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the product information below'
              : 'Add a new product to your catalog'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Coca-Cola 500ml" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Product description..."
                        {...field}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Carbonated">Carbonated</SelectItem>
                          <SelectItem value="Juices">Juices</SelectItem>
                          <SelectItem value="Energy Drinks">Energy Drinks</SelectItem>
                          <SelectItem value="Water">Water</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Image (Optional)</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        onRemove={() => field.onChange('')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing and UOM */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Pricing & Unit of Measure</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price (₱)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="25.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baseUOM"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base UOM</FormLabel>
                      <FormControl>
                        <Input placeholder="bottle, can, liter" {...field} />
                      </FormControl>
                      <FormDescription>
                        Base unit of measure
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Alternate UOMs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Alternate UOMs</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAlternateUOM}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add UOM
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No alternate UOMs added. Click &quot;Add UOM&quot; to add different selling units.
                </p>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">UOM #{index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`alternateUOMs.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UOM Name</FormLabel>
                          <FormControl>
                            <Input placeholder="pack, carton" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`alternateUOMs.${index}.conversionFactor`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conversion Factor</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="6"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            How many base units
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`alternateUOMs.${index}.sellingPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selling Price (₱)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="140.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Inventory Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Inventory Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minStockLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Stock Level</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Alert when stock falls below this level
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shelfLifeDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shelf Life (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="365"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Days until product expires
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
