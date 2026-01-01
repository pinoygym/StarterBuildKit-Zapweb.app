import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  SalesOrderWithItems,
  SalesOrderFilters,
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
} from '@/types/sales-order.types';

export function useSalesOrders(filters?: SalesOrderFilters) {
  const [salesOrders, setSalesOrders] = useState<SalesOrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
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
        setSalesOrders(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch sales orders',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch sales orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, [
    filters?.status,
    filters?.salesOrderStatus,
    filters?.branchId,
    filters?.warehouseId,
    filters?.search,
    filters?.startDate,
    filters?.endDate,
  ]);

  const createSalesOrder = async (data: CreateSalesOrderInput) => {
    try {
      const response = await fetch('/api/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Sales order created successfully',
        });
        await fetchSalesOrders();
        return true;
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create sales order',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error creating sales order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create sales order',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateSalesOrder = async (id: string, data: UpdateSalesOrderInput) => {
    try {
      const response = await fetch(`/api/sales-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Sales order updated successfully',
        });
        await fetchSalesOrders();
        return true;
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update sales order',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error updating sales order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sales order',
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelSalesOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/sales-orders/${id}/cancel`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Sales order cancelled successfully',
        });
        await fetchSalesOrders();
        return true;
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to cancel sales order',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error cancelling sales order:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel sales order',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    salesOrders,
    loading,
    createSalesOrder,
    updateSalesOrder,
    cancelSalesOrder,
    refetch: fetchSalesOrders,
  };
}
