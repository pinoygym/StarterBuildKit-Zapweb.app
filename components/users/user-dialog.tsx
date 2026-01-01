'use client';

import { useEffect, useState } from 'react';
import { UserWithRelations, CreateUserInput, UpdateUserInput } from '@/types/user.types';
import { useCreateUser, useUpdateUser } from '@/hooks/use-users';
import { useRoles } from '@/hooks/use-roles';
import { useBranches } from '@/hooks/use-branches';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Branch } from '@prisma/client';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserWithRelations | null;
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const isEdit = !!user;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: rolesData } = useRoles();
  const { branches } = useBranches();

  const roles = rolesData?.roles || [];

  const [formData, setFormData] = useState<any>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleId: '',
    branchId: '',
    status: 'ACTIVE' as const,
    branchLockEnabled: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        roleId: user.roleId,
        branchId: user.branchId || '',
        status: user.status,
        branchLockEnabled: user.branchLockEnabled || false,
      });
    } else {
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        roleId: '',
        branchId: '',
        status: 'ACTIVE',
        branchLockEnabled: false,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEdit) {
        const { password, ...updateData } = formData;
        await updateUser.mutateAsync({
          userId: user.id,
          data: updateData,
        });
        toast.success('User updated successfully');
      } else {
        await createUser.mutateAsync(formData);
        toast.success('User created successfully');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Create User'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roleId">Role *</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branchId">Branch</Label>
              <Select
                value={formData.branchId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, branchId: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {branches.map((branch: Branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isEdit && (
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="branchLock" className="text-base">
                  Lock Branch Selection
                </Label>
                <div className="text-sm text-muted-foreground">
                  Prevent this user from changing their selected branch
                </div>
              </div>
              <Switch
                id="branchLock"
                checked={formData.branchLockEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, branchLockEnabled: checked })
                }
              />
            </div>
          )}

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
