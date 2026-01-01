'use client';

import { useState } from 'react';
import { UserWithRelations, UserFilters } from '@/types/user.types';
import { useUsers } from '@/hooks/use-users';
import { UserTable } from '@/components/users/user-table';
import { UserDialog } from '@/components/users/user-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { TableSkeleton } from '@/components/shared/loading-skeleton';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<UserFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRelations | null>(null);

  const { data, isLoading } = useUsers(filters, page, 20);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ ...filters, search: value || undefined });
    setPage(1);
  };

  const handleEdit = (user: UserWithRelations) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage system users and their roles"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <>
          <UserTable
            users={data?.data || []}
            onEdit={handleEdit}
          />

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
      />
    </div>
  );
}
