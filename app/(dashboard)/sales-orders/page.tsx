'use client';

import { useState } from 'react';
import { Plus, Search, ShoppingBag, Calendar } from 'lucide-react';
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
import { SalesOrderTable } from '@/components/sales-orders/sales-order-table';
import { SalesOrderDialog } from '@/components/sales-orders/sales-order-dialog';
import { useSalesOrders } from '@/hooks/use-sales-orders';
import { useBranch } from '@/hooks/use-branch';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import {
  SalesOrderStatus,
  SalesOrderConversionStatus,
  SalesOrderWithItems,
} from '@/types/sales-order.types';

export default function SalesOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | 'all'>('all');
  const [conversionFilter, setConversionFilter] = useState<SalesOrderConversionStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrderWithItems | null>(null);

  const { activeBranch } = useBranch();

  const filters = {
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    salesOrderStatus: conversionFilter !== 'all' ? conversionFilter : undefined,
    branchId: activeBranch?.id,
  };

  const { salesOrders, loading, createSalesOrder, updateSalesOrder, cancelSalesOrder } =
    useSalesOrders(filters);

  const handleCreate = () => {
    setEditingOrder(null);
    setDialogOpen(true);
  };

  const handleEdit = (order: SalesOrderWithItems) => {
    setEditingOrder(order);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingOrder(null);
  };

  const handleSave = async (id: string | undefined, data: any) => {
    if (id) {
      return await updateSalesOrder(id, data);
    } else {
      return await createSalesOrder(data);
    }
  };

  const handleConvertToPOS = (order: SalesOrderWithItems) => {
    // This will be implemented in the POS module
    console.log('Convert to POS:', order);
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Sales Orders"
          description="Manage customer orders"
        />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Sales Orders"
        description="Manage customer orders and convert to POS sales"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales Orders' },
        ]}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name or order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as SalesOrderStatus | 'all')}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={conversionFilter}
          onValueChange={(value) =>
            setConversionFilter(value as SalesOrderConversionStatus | 'all')
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Conversion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales Order Table */}
      {salesOrders.length === 0 &&
      searchQuery === '' &&
      statusFilter === 'all' &&
      conversionFilter === 'all' ? (
        <EmptyState
          icon={ShoppingBag}
          title="No sales orders yet"
          description="Get started by creating your first customer order"
          actionLabel="Create Order"
          onAction={handleCreate}
        />
      ) : salesOrders.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <SalesOrderTable
          salesOrders={salesOrders}
          onEdit={handleEdit}
          onCancel={cancelSalesOrder}
          onConvertToPOS={handleConvertToPOS}
        />
      )}

      {/* Sales Order Dialog */}
      <SalesOrderDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        salesOrder={editingOrder}
        onSave={handleSave}
      />
    </div>
  );
}
