'use client';

import { useState } from 'react';
import { Plus, Search, Package } from 'lucide-react';
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
import { ProductTable } from '@/components/products/product-table';
import { ProductDialog } from '@/components/products/product-dialog';
import { useProducts } from '@/hooks/use-products';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ProductCategory, ProductStatus, ProductWithUOMs } from '@/types/product.types';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithUOMs | null>(null);

  const filters = {
    search: searchQuery || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts(filters);

  const handleCreate = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEdit = (product: ProductWithUOMs) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleSave = async (id: string | undefined, data: any) => {
    if (id) {
      return await updateProduct(id, data);
    } else {
      return await createProduct(data);
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog with multiple UOMs and pricing"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Products' },
        ]}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value as ProductCategory | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Carbonated">Carbonated</SelectItem>
            <SelectItem value="Juices">Juices</SelectItem>
            <SelectItem value="Energy Drinks">Energy Drinks</SelectItem>
            <SelectItem value="Water">Water</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ProductStatus | 'all')}
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

      {/* Product Table */}
      {loading ? (
        <TableSkeleton />
      ) : products.length === 0 && searchQuery === '' && categoryFilter === 'all' && statusFilter === 'all' ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Get started by adding your first product to the catalog"
          actionLabel="Add Product"
          onAction={handleCreate}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <ProductTable
          products={products}
          onEdit={handleEdit}
          onDelete={deleteProduct}
        />
      )}

      {/* Product Dialog */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        product={editingProduct}
        onSave={handleSave}
      />
    </div>
  );
}
