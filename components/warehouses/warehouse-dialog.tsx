'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Warehouse } from '@prisma/client';
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { warehouseSchema, WarehouseFormData } from '@/lib/validations/warehouse.validation';
import { useBranches } from '@/hooks/use-branches';

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse | null;
  onSave: (id: string | undefined, data: WarehouseFormData) => Promise<any>;
}

export function WarehouseDialog({
  open,
  onOpenChange,
  warehouse,
  onSave,
}: WarehouseDialogProps) {
  const { toast } = useToast();
  const { branches } = useBranches();
  const isEditing = !!warehouse;

  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      location: '',
      manager: '',
      maxCapacity: 1000,
      branchId: '',
    },
  });

  useEffect(() => {
    if (warehouse) {
      form.reset({
        name: warehouse.name,
        location: warehouse.location,
        manager: warehouse.manager,
        maxCapacity: warehouse.maxCapacity,
        branchId: warehouse.branchId,
      });
    } else {
      form.reset({
        name: '',
        location: '',
        manager: '',
        maxCapacity: 1000,
        branchId: '',
      });
    }
  }, [warehouse, form]);

  const onSubmit = async (data: WarehouseFormData) => {
    try {
      const result = await onSave(warehouse?.id, data);

      if (result.success) {
        toast({
          title: 'Success',
          description: `Warehouse ${isEditing ? 'updated' : 'created'} successfully`,
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
          description: result.error || `Failed to ${isEditing ? 'update' : 'create'} warehouse`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} warehouse`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Warehouse' : 'Create Warehouse'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the warehouse information below'
              : 'Add a new warehouse location to your system'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Warehouse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Storage St, Manila" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manager"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum storage capacity in base UOM units
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormDescription>
                    Assign this warehouse to a branch
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
