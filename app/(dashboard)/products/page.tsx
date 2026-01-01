'use client';

import { useState } from 'react';
import { Plus, Search, Package, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useProducts } from '@/hooks/use-products';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ProductCategory, ProductStatus, ProductWithUOMs } from '@/types/product.types';
import dynamic from 'next/dynamic'; // Import dynamic

// Dynamically import ProductDialog for lazy loading
const DynamicProductDialog = dynamic(() => import('@/components/products/product-dialog').then(mod => mod.ProductDialog), {
  ssr: false, // Ensure it's client-side rendered only
  loading: () => <p>Loading dialog...</p>, // Simple loading fallback
});

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithUOMs | null>(null);

  const filters = {
    search: searchQuery || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit,
  };

  const { products, pagination, loading, createProduct, updateProduct, deleteProduct } = useProducts(filters);

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleCategoryChange = (value: ProductCategory | 'all') => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handleStatusChange = (value: ProductStatus | 'all') => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleLimitChange = (value: string) => {
    setLimit(parseInt(value));
    setPage(1);
  };

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
      return await updateProduct({ id, data });
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={(value) => handleCategoryChange(value as ProductCategory | 'all')}
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
          onValueChange={(value) => handleStatusChange(value as ProductStatus | 'all')}
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
        <div className="space-y-4">
          <ProductTable
            products={products}
            onEdit={handleEdit}
            onDelete={deleteProduct}
          />

          {/* Pagination Controls */}
          {pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} products
              </div>

              <div className="flex items-center gap-2 order-1 sm:order-2">
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-sm text-muted-foreground hidden sm:inline">Rows per page</span>
                  <Select
                    value={limit.toString()}
                    onValueChange={handleLimitChange}
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

      {/* Product Dialog */}
      {dialogOpen && ( // Only render DynamicProductDialog when dialogOpen is true
        <DynamicProductDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          product={editingProduct}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
