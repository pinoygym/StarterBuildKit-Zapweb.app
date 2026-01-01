'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { RoleWithPermissions, CreateRoleInput, UpdateRoleInput } from '@/types/role.types';
import { useCreateRole, useUpdateRole } from '@/hooks/use-roles';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RoleWithPermissions | null;
}

export function RoleDialog({ open, onOpenChange, role }: RoleDialogProps) {
  const isEdit = !!role;
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleInput | UpdateRoleInput>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description || '',
      });
    } else {
      reset({
        name: '',
        description: '',
      });
    }
  }, [role, reset]);

  const onSubmit = async (data: CreateRoleInput | UpdateRoleInput) => {
    try {
      if (isEdit) {
        await updateRole.mutateAsync({
          roleId: role.id,
          data: data as UpdateRoleInput,
        });
        toast.success('Role updated successfully');
      } else {
        await createRole.mutateAsync(data as CreateRoleInput);
        toast.success('Role created successfully');
      }
      onOpenChange(false);
      reset();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Role' : 'Create Role'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Role name is required' })}
              disabled={role?.isSystem}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
