'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Package, Filter } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { TransferStockDialog } from '@/components/inventory/transfer-stock-dialog';
import { AdjustStockDialog } from '@/components/inventory/adjust-stock-dialog';
import { useInventory } from '@/hooks/use-inventory';
import { useProducts } from '@/hooks/use-products';
import { useWarehouses } from '@/hooks/use-warehouses';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { InventoryBatchStatus, InventoryBatchWithRelations, StockLevel } from '@/types/inventory.types';

export default function InventoryPage() {
  const [productFilter, setProductFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<InventoryBatchStatus | 'all'>('all');
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expiring' | 'expired'>('all');
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatchWithRelations | null>(null);

  const filters = {
    productId: productFilter !== 'all' ? productFilter : undefined,
    warehouseId: warehouseFilter !== 'all' ? warehouseFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    expiryDateFrom: expiryFilter === 'expiring' ? new Date() : undefined,
    expiryDateTo: expiryFilter === 'expiring' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      : expiryFilter === 'expired'
      ? new Date()
      : undefined,
  };

  const { batches, stockLevels, loading, refetch, fetchStockLevels } = useInventory(filters);
  const { products } = useProducts({ status: 'active' });
  const { warehouses } = useWarehouses();

  useEffect(() => {
    fetchStockLevels(warehouseFilter !== 'all' ? warehouseFilter : undefined);
  }, [warehouseFilter]);

  const handleTransfer = (batch: InventoryBatchWithRelations) => {
    setSelectedBatch(batch);
    setTransferDialogOpen(true);
  };

  const handleAdjust = (batch: InventoryBatchWithRelations) => {
    setSelectedBatch(batch);
    setAdjustDialogOpen(true);
  };

  const handleSuccess = () => {
    refetch();
    fetchStockLevels(warehouseFilter !== 'all' ? warehouseFilter : undefined);
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalValue = batches.reduce(
      (sum, batch) => sum + Number(batch.quantity) * Number(batch.unitCost),
      0
    );

    const expiringCount = batches.filter((batch) => {
      const daysUntilExpiry = Math.ceil(
        (new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length;

    const expiredCount = batches.filter((batch) => {
      return new Date(batch.expiryDate) < new Date();
    }).length;

    return { totalValue, expiringCount, expiredCount };
  };

  const summary = calculateSummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Inventory"
          description="Track inventory batches with average costing"
        />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Inventory"
        description="Track inventory batches with weighted average costing and expiry dates"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory' },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Weighted average cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.expiringCount}</div>
            <p className="text-xs text-muted-foreground">
              Within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Batches</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.expiredCount}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Select
          value={productFilter}
          onValueChange={setProductFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={warehouseFilter}
          onValueChange={setWarehouseFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as InventoryBatchStatus | 'all')}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="depleted">Depleted</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={expiryFilter}
          onValueChange={(value) => setExpiryFilter(value as 'all' | 'expiring' | 'expired')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Expiry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            <SelectItem value="expiring">Expiring Soon (30d)</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      {batches.length === 0 && productFilter === 'all' && warehouseFilter === 'all' ? (
        <EmptyState
          icon={Package}
          title="No inventory batches yet"
          description="Inventory batches will appear here when you receive purchase orders"
        />
      ) : batches.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description="Try adjusting your filters"
        />
      ) : (
        <InventoryTable 
          batches={batches} 
          onTransfer={handleTransfer}
          onAdjust={handleAdjust}
        />
      )}

      {/* Transfer Dialog */}
      <TransferStockDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        batch={selectedBatch}
        onSuccess={handleSuccess}
      />

      {/* Adjust Dialog */}
      <AdjustStockDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        batch={selectedBatch}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
