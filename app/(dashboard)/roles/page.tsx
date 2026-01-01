'use client';

import { useState } from 'react';
import { RoleWithPermissions } from '@/types/role.types';
import { useRoles } from '@/hooks/use-roles';
import { RoleTable } from '@/components/roles/role-table';
import { RoleDialog } from '@/components/roles/role-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { toast } from 'sonner';

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);

  const { data, isLoading } = useRoles({ search: searchTerm || undefined });

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
    // TODO: Implement permissions management dialog
    toast.info('Permissions management coming soon');
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
    </div>
  );
}
