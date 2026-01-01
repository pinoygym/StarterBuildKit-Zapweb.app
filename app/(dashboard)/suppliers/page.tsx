'use client';

import { useState } from 'react';
import { Plus, Search, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SupplierTable } from '@/components/suppliers/supplier-table';
import { SupplierDialog } from '@/components/suppliers/supplier-dialog';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '@/hooks/use-suppliers';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Supplier } from '@prisma/client';
import { SupplierStatus } from '@/types/supplier.types';

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const filters = {
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit,
  };

  const { data: suppliers, pagination, isLoading: loading } = useSuppliers(filters);
  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();

  const handleCreate = () => {
    setEditingSupplier(null);
    setDialogOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingSupplier(null);
  };

  const handleSave = async (id: string | undefined, data: any) => {
    if (id) {
      await updateSupplierMutation.mutateAsync({ id, data });
    } else {
      await createSupplierMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSupplierMutation.mutateAsync(id);
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Suppliers"
          description="Manage your supplier relationships"
        />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Suppliers"
        description="Manage supplier information and payment terms"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Suppliers' },
        ]}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as SupplierStatus | 'all');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Supplier Table */}
      {(suppliers || []).length === 0 && searchQuery === '' && statusFilter === 'all' ? (
        <EmptyState
          icon={Building2}
          title="No suppliers yet"
          description="Get started by adding your first supplier"
          actionLabel="Add Supplier"
          onAction={handleCreate}
        />
      ) : (suppliers || []).length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="space-y-4">
          <SupplierTable
            suppliers={suppliers || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Pagination Controls */}
          {pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} suppliers
              </div>

              <div className="flex items-center gap-2 order-1 sm:order-2">
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-sm text-muted-foreground hidden sm:inline">Rows per page</span>
                  <Select
                    value={limit.toString()}
                    onValueChange={(value) => {
                      setLimit(parseInt(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.hasMore || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Supplier Dialog */}
      <SupplierDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        supplier={editingSupplier}
        onSave={handleSave}
      />
    </div>
  );
}
