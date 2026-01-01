import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryWithRelations, InventoryFilters } from '@/types/inventory.types';
import { toast } from '@/hooks/use-toast';

interface UseInventoryOptions extends InventoryFilters { }

/**
 * Hook to fetch inventory data with React Query
 */
export function useInventory(options?: UseInventoryOptions) {
  return useQuery({
    queryKey: ['inventory', options],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (options?.productId) params.append('productId', options.productId);
      if (options?.warehouseId) params.append('warehouseId', options.warehouseId);

      const response = await fetch(`/api/inventory?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch inventory');
      }

      return Array.isArray(data.data) ? data.data : [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to add stock to inventory
 */
export function useAddStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/inventory/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add stock');
      }

      return result;
    },
    onSuccess: (result) => {
      toast({
        title: 'Success',
        description: result.message || 'Stock added successfully',
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add stock',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to deduct stock from inventory
 */
export function useDeductStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/inventory/deduct-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to deduct stock');
      }

      return result;
    },
    onSuccess: (result) => {
      toast({
        title: 'Success',
        description: result.message || 'Stock deducted successfully',
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deduct stock',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to transfer stock between warehouses
 */
export function useTransferStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to transfer stock');
      }

      return result;
    },
    onSuccess: (result) => {
      toast({
        title: 'Success',
        description: result.message || 'Stock transferred successfully',
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to transfer stock',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to adjust stock (used for adjustments)
 */
export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to adjust stock');
      }

      return result;
    },
    onSuccess: (result) => {
      toast({
        title: 'Success',
        description: result.message || 'Stock adjusted successfully',
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to adjust stock',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to batch transfer stocks
 */
export function useBatchTransferStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/inventory/transfer/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to transfer stocks');
      }

      return result;
    },
    onSuccess: (result) => {
      toast({
        title: 'Success',
        description: result.message || 'Stocks transferred successfully',
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to transfer stocks',
        variant: 'destructive',
      });
    },
  });
}
