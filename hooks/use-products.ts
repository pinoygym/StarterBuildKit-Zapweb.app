'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductWithUOMs, ProductFilters } from '@/types/product.types';

export function useProducts(filters?: ProductFilters) {
  const [products, setProducts] = useState<ProductWithUOMs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Build query string from filters
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString();
      const url = `/api/products${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.category, filters?.status, filters?.search]);

  useEffect(() => {
    // Debounce search to avoid excessive API calls
    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, filters?.search ? 300 : 0); // 300ms delay for search, immediate for other filters

    return () => clearTimeout(debounceTimer);
  }, [fetchProducts, filters?.search]);

  const createProduct = async (data: any) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      await fetchProducts();
    }

    return result;
  };

  const updateProduct = async (id: string, data: any) => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      await fetchProducts();
    }

    return result;
  };

  const deleteProduct = async (id: string) => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      await fetchProducts();
    }

    return result;
  };

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
