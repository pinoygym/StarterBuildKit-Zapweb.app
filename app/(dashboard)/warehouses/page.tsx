'use client';

import { useState } from 'react';
import { Plus, Search, Warehouse as WarehouseIcon } from 'lucide-react';
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
import { WarehouseTable } from '@/components/warehouses/warehouse-table';
import { WarehouseDialog } from '@/components/warehouses/warehouse-dialog';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useBranches } from '@/hooks/use-branches';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';

export default function WarehousesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const { branches } = useBranches();
  const { warehouses, loading, createWarehouse, updateWarehouse, deleteWarehouse } = useWarehouses();

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      warehouse.name.toLowerCase().includes(query) ||
      warehouse.location.toLowerCase().includes(query) ||
      warehouse.manager.toLowerCase().includes(query);

    const matchesBranch =
      selectedBranch === 'all' || warehouse.branchId === selectedBranch;

    return matchesSearch && matchesBranch;
  });

  const handleCreate = () => {
    setEditingWarehouse(null);
    setDialogOpen(true);
  };

  const handleEdit = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingWarehouse(null);
  };

  const handleSave = async (id: string | undefined, data: any) => {
    if (id) {
      return await updateWarehouse(id, data);
    } else {
      return await createWarehouse(data);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Warehouses"
          description="Manage warehouse locations and capacity"
        />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Warehouses"
        description="Manage warehouse locations and capacity"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Warehouses' },
        ]}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search warehouses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Warehouse Table */}
      {filteredWarehouses.length === 0 && searchQuery === '' && selectedBranch === 'all' ? (
        <EmptyState
          icon={WarehouseIcon}
          title="No warehouses yet"
          description="Get started by creating your first warehouse location"
          actionLabel="Add Warehouse"
          onAction={handleCreate}
        />
      ) : filteredWarehouses.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description="Try adjusting your search or filter criteria"
        />
      ) : (
        <WarehouseTable
          warehouses={filteredWarehouses}
          onEdit={handleEdit}
          onDelete={deleteWarehouse}
        />
      )}

      {/* Warehouse Dialog */}
      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        warehouse={editingWarehouse}
        onSave={handleSave}
      />
    </div>
  );
}
