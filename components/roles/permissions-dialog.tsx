'use client';

import { useState, useEffect, useMemo } from 'react';
import { Permission } from '@prisma/client';
import { RoleWithPermissions } from '@/types/role.types';
import { useAssignPermissions } from '@/hooks/use-roles';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, CheckSquare, Square } from 'lucide-react';

interface PermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleWithPermissions | null;
}

export function PermissionsDialog({ open, onOpenChange, role }: PermissionsDialogProps) {
  const { permissions, isLoading: loadingPermissions } = usePermissions(true);
  const assignPermissions = useAssignPermissions();
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    if (Array.isArray(permissions)) {
      // If not grouped, group them manually
      return (permissions as Permission[]).reduce((acc, permission) => {
        if (!acc[permission.resource]) {
          acc[permission.resource] = [];
        }
        acc[permission.resource].push(permission);
        return acc;
      }, {} as Record<string, Permission[]>);
    }
    return permissions as Record<string, Permission[]>;
  }, [permissions]);

  // Initialize selected permissions when role changes
  useEffect(() => {
    if (role && open) {
      const rolePermissionIds = role.permissions?.map((rp) => rp.permission.id) || [];
      setSelectedPermissionIds(rolePermissionIds);
    }
  }, [role, open]);

  // Check if a permission is selected
  const isPermissionSelected = (permissionId: string) => {
    return selectedPermissionIds.includes(permissionId);
  };

  // Toggle individual permission
  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Check if all permissions in a resource are selected
  const isResourceFullySelected = (resourcePermissions: Permission[]) => {
    return resourcePermissions.every((p) => selectedPermissionIds.includes(p.id));
  };

  // Check if some (but not all) permissions in a resource are selected
  const isResourcePartiallySelected = (resourcePermissions: Permission[]) => {
    const selectedCount = resourcePermissions.filter((p) =>
      selectedPermissionIds.includes(p.id)
    ).length;
    return selectedCount > 0 && selectedCount < resourcePermissions.length;
  };

  // Toggle all permissions in a resource
  const toggleResourcePermissions = (resourcePermissions: Permission[]) => {
    const resourcePermissionIds = resourcePermissions.map((p) => p.id);
    const allSelected = isResourceFullySelected(resourcePermissions);

    if (allSelected) {
      // Deselect all in this resource
      setSelectedPermissionIds((prev) =>
        prev.filter((id) => !resourcePermissionIds.includes(id))
      );
    } else {
      // Select all in this resource
      setSelectedPermissionIds((prev) => {
        const newIds = resourcePermissionIds.filter((id) => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  };

  // Select all permissions
  const selectAll = () => {
    const allPermissionIds = Object.values(groupedPermissions)
      .flat()
      .map((p) => p.id);
    setSelectedPermissionIds(allPermissionIds);
  };

  // Deselect all permissions
  const selectNone = () => {
    setSelectedPermissionIds([]);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!role) return;

    try {
      setIsSubmitting(true);
      await assignPermissions.mutateAsync({
        roleId: role.id,
        permissionIds: selectedPermissionIds,
      });
      toast.success('Permissions updated successfully');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update permissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format resource name for display
  const formatResourceName = (resource: string) => {
    return resource
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format action name for display
  const formatActionName = (action: string) => {
    return action.charAt(0) + action.slice(1).toLowerCase();
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Manage Permissions - {role.name}</DialogTitle>
          <DialogDescription>
            {role.description || 'Configure permissions for this role'}
          </DialogDescription>
        </DialogHeader>

        {loadingPermissions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-2">
              <div className="text-sm text-muted-foreground">
                {selectedPermissionIds.length} of{' '}
                {Object.values(groupedPermissions).flat().length} permissions selected
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={role.isSystem}
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectNone}
                  disabled={role.isSystem}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>

            <Separator />

            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => {
                  const isFullySelected = isResourceFullySelected(resourcePermissions);
                  const isPartiallySelected = isResourcePartiallySelected(resourcePermissions);

                  return (
                    <div key={resource} className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`resource-${resource}`}
                          checked={isFullySelected ? true : isPartiallySelected ? 'indeterminate' : false}
                          onCheckedChange={() => toggleResourcePermissions(resourcePermissions)}
                          disabled={role.isSystem}
                        />
                        <Label
                          htmlFor={`resource-${resource}`}
                          className="text-base font-semibold cursor-pointer"
                        >
                          {formatResourceName(resource)}
                        </Label>
                      </div>

                      <div className="ml-6 grid grid-cols-2 gap-2">
                        {resourcePermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={isPermissionSelected(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                              disabled={role.isSystem}
                            />
                            <Label
                              htmlFor={permission.id}
                              className="text-sm cursor-pointer font-normal"
                            >
                              {formatActionName(permission.action)}
                              {permission.description && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({permission.description})
                                </span>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>

                      <Separator className="mt-4" />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          {role.isSystem && (
            <p className="text-sm text-muted-foreground mr-auto">
              System roles cannot be modified
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || role.isSystem || loadingPermissions}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
