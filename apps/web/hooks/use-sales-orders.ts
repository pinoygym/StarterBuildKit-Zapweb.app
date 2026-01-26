import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  SalesOrderWithItems,
  SalesOrderFilters,
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
} from '@/types/sales-order.types';

export function useSalesOrders(filters?: SalesOrderFilters) {
  const queryClient = useQueryClient();

  const queryKey = ['salesOrders', filters];

  const {
    data: salesOrders,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<SalesOrderWithItems[], Error>({
    queryKey: queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.status) params.append('status', filters.status);
      if (filters?.salesOrderStatus) params.append('salesOrderStatus', filters.salesOrderStatus);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/sales-orders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch sales orders');
      }
    },
    // Debounce search to avoid excessive API calls
    staleTime: filters?.search ? 300 : 0,
    placeholderData: keepPreviousData,
  });

  const createSalesOrderMutation = useMutation<any, Error, CreateSalesOrderInput>({
    mutationFn: async (data) => {
      const response = await fetch('/api/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        return result;
      }
      throw new Error(result.error || 'Failed to create sales order');
    },
    onSuccess: () => {
      // Invalidate related queries - sales orders affect inventory and AR
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['ar'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Success',
        description: 'Sales order created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create sales order',
        variant: 'destructive',
      });
    },
  });

  const updateSalesOrderMutation = useMutation<any, Error, { id: string; data: UpdateSalesOrderInput }>({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/sales-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        return result;
      }
      throw new Error(result.error || 'Failed to update sales order');
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['ar'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Success',
        description: 'Sales order updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update sales order',
        variant: 'destructive',
      });
    },
  });

  const cancelSalesOrderMutation = useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/sales-orders/${id}/cancel`, {
        method: 'POST',
      });

      const result = await response.json();
      if (result.success) {
        return result;
      }
      throw new Error(result.error || 'Failed to cancel sales order');
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Success',
        description: 'Sales order cancelled successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel sales order',
        variant: 'destructive',
      });
    },
  });

  return {
    salesOrders: salesOrders || [],
    loading,
    error,
    refetch,
    createSalesOrder: createSalesOrderMutation.mutateAsync,
    updateSalesOrder: updateSalesOrderMutation.mutateAsync,
    cancelSalesOrder: cancelSalesOrderMutation.mutateAsync,
  };
}
