'use client';

import { useState } from 'react';
import { Plus, Search, Building2 } from 'lucide-react';
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
import { useSuppliers } from '@/hooks/use-suppliers';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Supplier } from '@prisma/client';
import { SupplierStatus } from '@/types/supplier.types';

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const filters = {
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const { suppliers, loading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers(filters);

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
      return await updateSupplier(id, data);
    } else {
      return await createSupplier(data);
    }
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as SupplierStatus | 'all')}
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
      {suppliers.length === 0 && searchQuery === '' && statusFilter === 'all' ? (
        <EmptyState
          icon={Building2}
          title="No suppliers yet"
          description="Get started by adding your first supplier"
          actionLabel="Add Supplier"
          onAction={handleCreate}
        />
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <SupplierTable
          suppliers={suppliers}
          onEdit={handleEdit}
          onDelete={deleteSupplier}
        />
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
