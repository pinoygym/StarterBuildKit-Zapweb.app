'use client';

import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PurchaseOrderTable } from '@/components/purchase-orders/purchase-order-table';
import { usePurchaseOrders } from '@/hooks/use-purchase-orders';
import { useBranches } from '@/hooks/use-branches';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { PurchaseOrderStatus, PurchaseOrderWithDetails } from '@/types/purchase-order.types';
import { useRouter } from 'next/navigation';

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const { branches } = useBranches();

  const filters = {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    branchId: branchFilter !== 'all' ? branchFilter : undefined,
  };

  const {
    purchaseOrders,
    loading,
    receivePurchaseOrder,
    cancelPurchaseOrder,
  } = usePurchaseOrders(filters);

  const handleCreate = () => {
    router.push('/purchase-orders/new');
  };

  const handleEdit = (po: PurchaseOrderWithDetails) => {
    router.push(`/purchase-orders/${po.id}/edit`);
  };

  const handleView = (po: PurchaseOrderWithDetails) => {
    router.push(`/purchase-orders/${po.id}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Purchase Orders"
          description="Manage procurement workflow"
        />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage procurement workflow and supplier orders"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Purchase Orders' },
        ]}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Purchase Order
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as PurchaseOrderStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={branchFilter}
          onValueChange={(value) => setBranchFilter(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Branch" />
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

      {/* Purchase Order Table */}
      {purchaseOrders.length === 0 && statusFilter === 'all' && branchFilter === 'all' ? (
        <EmptyState
          icon={FileText}
          title="No purchase orders yet"
          description="Get started by creating your first purchase order"
          actionLabel="Create Purchase Order"
          onAction={handleCreate}
        />
      ) : purchaseOrders.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No results found"
          description="Try adjusting your filters"
        />
      ) : (
        <PurchaseOrderTable
          purchaseOrders={purchaseOrders}
          onEdit={handleEdit}
          onReceive={receivePurchaseOrder}
          onCancel={cancelPurchaseOrder}
          onView={handleView}
        />
      )}
    </div>
  );
}
