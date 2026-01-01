'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Branch } from '@prisma/client';
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
import { branchSchema, BranchFormData } from '@/lib/validations/branch.validation';

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch | null;
  onSave: (id: string | undefined, data: BranchFormData) => Promise<any>;
}

export function BranchDialog({
  open,
  onOpenChange,
  branch,
  onSave,
}: BranchDialogProps) {
  const { toast } = useToast();
  const isEditing = !!branch;

  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      code: '',
      location: '',
      manager: '',
      phone: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset({
        name: branch.name,
        code: branch.code,
        location: branch.location,
        manager: branch.manager,
        phone: branch.phone,
        status: branch.status as 'active' | 'inactive',
      });
    } else {
      form.reset({
        name: '',
        code: '',
        location: '',
        manager: '',
        phone: '',
        status: 'active',
      });
    }
  }, [branch, form]);

  const onSubmit = async (data: BranchFormData) => {
    try {
      const result = await onSave(branch?.id, data);

      if (result.success) {
        toast({
          title: 'Success',
          description: `Branch ${isEditing ? 'updated' : 'created'} successfully`,
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
          description: result.error || `Failed to ${isEditing ? 'update' : 'create'} branch`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} branch`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Branch' : 'Create Branch'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the branch information below'
              : 'Add a new branch location to your system'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Branch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Code</FormLabel>
                  <FormControl>
                    <Input placeholder="MB001" {...field} />
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
                    <Input placeholder="123 Main St, Manila" {...field} />
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
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+63 912 345 6789" {...field} />
                  </FormControl>
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
