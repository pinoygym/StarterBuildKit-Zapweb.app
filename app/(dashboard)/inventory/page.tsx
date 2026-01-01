'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Search, Package, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { TransferStockDialog } from '@/components/inventory/transfer-stock-dialog';
import { AdjustStockDialog } from '@/components/inventory/adjust-stock-dialog';
import { useInventory } from '@/hooks/use-inventory';
import { useProducts } from '@/hooks/use-products';
import { useWarehouses } from '@/hooks/use-warehouses';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { InventoryWithRelations } from '@/types/inventory.types';
import { formatCurrency, formatQuantity } from '@/lib/utils';

export default function InventoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryWithRelations | null>(null);

  const filters = {
    productId: productFilter !== 'all' ? productFilter : undefined,
    warehouseId: warehouseFilter !== 'all' ? warehouseFilter : undefined,
  };

  const { data: inventory = [], isLoading, refetch } = useInventory(filters);
  const { products } = useProducts({ status: 'active' });
  const { data: warehouses } = useWarehouses();

  const handleTransfer = (item: InventoryWithRelations) => {
    setSelectedItem(item);
    setTransferDialogOpen(true);
  };

  const handleAdjust = (item: InventoryWithRelations) => {
    setSelectedItem(item);
    setAdjustDialogOpen(true);
  };

  const handleSuccess = () => {
    refetch();
  };

  const handleNewTransfer = () => {
    router.push('/inventory/transfers/new');
  };

  // Filter inventory based on search query
  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) {
      return inventory;
    }

    const query = searchQuery.toLowerCase();
    return inventory.filter(item =>
      item.Product.name.toLowerCase().includes(query)
    );
  }, [inventory, searchQuery]);

  // Calculate summary statistics
  const totalValue = filteredInventory.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.Product.averageCostPrice || 0),
    0
  );

  const totalItems = filteredInventory.length;
  const totalQuantity = filteredInventory.reduce((sum, item) => sum + Number(item.quantity), 0);



  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Inventory"
          description="Track inventory with average costing"
        />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Inventory"
        description="Track inventory levels with weighted average costing"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => router.push('/inventory/adjustments/new')} variant="outline">
              <Package className="h-4 w-4 mr-2" />
              New Adjustment Slip
            </Button>
            <Button onClick={handleNewTransfer}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              New Batch Transfer
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Weighted average cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Product-warehouse combinations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatQuantity(totalQuantity)}</div>
            <p className="text-xs text-muted-foreground">
              Units in stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Input */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            value={productFilter}
            onValueChange={setProductFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {(products || []).map((product) => (
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
              {(warehouses || []).map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inventory Table */}
      {inventory.length === 0 && productFilter === 'all' && warehouseFilter === 'all' ? (
        <EmptyState
          icon={Package}
          title="No inventory yet"
          description="Inventory will appear here when you receive purchase orders"
        />
      ) : filteredInventory.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <InventoryTable
          inventory={filteredInventory}
          onTransfer={handleTransfer}
          onAdjust={handleAdjust}
        />
      )}

      {/* Transfer Dialog */}
      <TransferStockDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        item={selectedItem}
        onSuccess={handleSuccess}
      />

      {/* Adjust Dialog */}
      <AdjustStockDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        item={selectedItem}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
