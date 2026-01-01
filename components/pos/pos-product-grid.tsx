'use client';

import { useState, useEffect } from 'react';
import { Search, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductWithStock } from '@/types/pos.types';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { toast } from '@/hooks/use-toast';

interface POSProductGridProps {
  warehouseId: string;
  onAddToCart: (product: ProductWithStock, uom: string, quantity: number) => void;
}

export function POSProductGrid({ warehouseId, onAddToCart }: POSProductGridProps) {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (!warehouseId) {
      setLoading(false);
      return;
    }
    
    fetchProducts();
  }, [warehouseId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products for warehouse:', warehouseId);
      const response = await fetch(`/api/pos/products?warehouseId=${warehouseId}`);
      const data = await response.json();

      console.log('Products response:', data);

      if (data.success) {
        setProducts(data.data);
        console.log('Products loaded:', data.data.length);
      } else {
        console.error('Failed to fetch products:', data.error);
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch products',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter products - show all products but filter by search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: ProductWithStock) => {
    if (!product.inStock) {
      toast({
        title: 'Out of Stock',
        description: `${product.name} is currently out of stock`,
        variant: 'destructive',
      });
      return;
    }

    // Add with base UOM by default
    onAddToCart(product, product.baseUOM, 1);
    
    toast({
      title: 'Added to Cart',
      description: `${product.name} added to cart`,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <TableSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
        </div>
      </CardHeader>

      <CardContent>
        {!warehouseId ? (
          <EmptyState
            icon={Package}
            title="No warehouse selected"
            description="Please select a warehouse to view products"
          />
        ) : filteredProducts.length === 0 && products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products available"
            description="No active products found"
          />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description="Try adjusting your search or filters"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  !product.inStock ? 'opacity-60' : ''
                }`}
                onClick={() => handleAddToCart(product)}
              >
                <CardContent className="p-4">
                  {/* Product Image */}
                  <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ₱{product.basePrice.toFixed(2)}
                      </span>
                      <Badge variant={product.inStock ? 'default' : 'destructive'}>
                        {product.inStock ? 'In Stock' : 'Out'}
                      </Badge>
                    </div>

                    {/* Stock Info */}
                    {product.inStock && (
                      <div className="text-xs text-muted-foreground">
                        Stock: {product.currentStock} {product.baseUOM}
                      </div>
                    )}

                    {/* Available UOMs */}
                    <div className="text-xs text-muted-foreground">
                      {product.baseUOM}
                      {product.alternateUOMs.length > 0 && (
                        <span> (+{product.alternateUOMs.length} more)</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
