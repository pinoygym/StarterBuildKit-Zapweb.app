'use client';

import { useCallback } from 'react';
import { ProductWithUOMs, ProductFilters, PaginationMetadata } from '@/types/product.types';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

export function useProducts(filters?: ProductFilters, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const queryKey = ['products', filters];

  const {
    data: responseData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<{ data: ProductWithUOMs[], pagination: PaginationMetadata }, Error>({
    queryKey: queryKey,
    enabled: options?.enabled,
    queryFn: async () => {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = `/api/products${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        return { data: data.data, pagination: data.pagination };
      } else {
        throw new Error(data.error || 'Failed to fetch products');
      }
    },
    // Debounce search to avoid excessive API calls
    // Using a function to control debounce behavior
    // For non-search filters, it runs immediately (staleTime: 0 in QueryClient, or here)
    // For search, add a debounce
    staleTime: filters?.search ? 300 : 0, // Debounce search
    placeholderData: keepPreviousData, // Keep previous data while fetching new data for search
  });

  const createProductMutation = useMutation<any, Error, any>({
    mutationFn: async (data) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        return result;
      }
      throw new Error(result.error || 'Failed to create product');
    },
    onSuccess: () => {
      // Invalidate related queries - products affect inventory and dashboard
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const updateProductMutation = useMutation<any, Error, { id: string; data: any }>({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        return result;
      }
      throw new Error(result.error || 'Failed to update product');
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteProductMutation = useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        return result;
      }
      throw new Error(result.error || 'Failed to delete product');
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    products: responseData?.data || [],
    pagination: responseData?.pagination,
    loading,
    error,
    refetch,
    createProduct: createProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    deleteProduct: deleteProductMutation.mutateAsync,
  };
}
