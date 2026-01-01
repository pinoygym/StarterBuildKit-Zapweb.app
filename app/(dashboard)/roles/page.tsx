'use client';

import { useState } from 'react';
import { RoleWithPermissions } from '@/types/role.types';
import { useRoles } from '@/hooks/use-roles';
import { RoleTable } from '@/components/roles/role-table';
import { RoleDialog } from '@/components/roles/role-dialog';
import { PermissionsDialog } from '@/components/roles/permissions-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ShieldAlert } from 'lucide-react';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { useAuth } from '@/contexts/auth.context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function RolesPage() {
  const { isSuperMegaAdmin, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<RoleWithPermissions | null>(null);

  const { data, isLoading } = useRoles({ search: searchTerm || undefined });

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Roles"
          description="Manage user roles and permissions"
        />
        <TableSkeleton rows={10} />
      </div>
    );
  }

  // Check if user is super admin
  if (!isSuperMegaAdmin()) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Roles"
          description="Manage user roles and permissions"
        />
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view roles. This page is restricted to Super Admins only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const roles = data?.roles || [];

  const handleEdit = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setDialogOpen(true);
  };

  const handleManagePermissions = (role: RoleWithPermissions) => {
    setSelectedRoleForPermissions(role);
    setPermissionsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Manage user roles and permissions"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <RoleTable
          roles={roles}
          onEdit={handleEdit}
          onManagePermissions={handleManagePermissions}
        />
      )}

      <RoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={selectedRole}
      />

      <PermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        role={selectedRoleForPermissions}
      />
    </div>
  );
}
