import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  PurchaseOrderWithDetails,
  PurchaseOrderFilters,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from '@/types/purchase-order.types';

export function usePurchaseOrders(filters?: PurchaseOrderFilters) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.branchId) queryParams.append('branchId', filters.branchId);
      if (filters?.supplierId) queryParams.append('supplierId', filters.supplierId);
      if (filters?.warehouseId) queryParams.append('warehouseId', filters.warehouseId);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) queryParams.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/purchase-orders?${queryParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPurchaseOrders(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch purchase orders',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch purchase orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [filters?.status, filters?.branchId, filters?.supplierId, filters?.warehouseId, filters?.startDate, filters?.endDate]);

  const createPurchaseOrder = async (data: CreatePurchaseOrderInput) => {
    try {
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Purchase order created successfully',
        });
        await fetchPurchaseOrders();
        return { success: true, data: result.data };
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create purchase order',
          variant: 'destructive',
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create purchase order',
        variant: 'destructive',
      });
      return { success: false, error: 'Failed to create purchase order' };
    }
  };

  const updatePurchaseOrder = async (id: string, data: UpdatePurchaseOrderInput) => {
    try {
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Purchase order updated successfully',
        });
        await fetchPurchaseOrders();
        return { success: true, data: result.data };
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update purchase order',
          variant: 'destructive',
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error updating purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update purchase order',
        variant: 'destructive',
      });
      return { success: false, error: 'Failed to update purchase order' };
    }
  };

  const receivePurchaseOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/purchase-orders/${id}/receive`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Purchase order received successfully',
        });
        await fetchPurchaseOrders();
        return { success: true, data: result.data };
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to receive purchase order',
          variant: 'destructive',
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to receive purchase order',
        variant: 'destructive',
      });
      return { success: false, error: 'Failed to receive purchase order' };
    }
  };

  const cancelPurchaseOrder = async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/purchase-orders/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Purchase order cancelled successfully',
        });
        await fetchPurchaseOrders();
        return { success: true, data: result.data };
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to cancel purchase order',
          variant: 'destructive',
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel purchase order',
        variant: 'destructive',
      });
      return { success: false, error: 'Failed to cancel purchase order' };
    }
  };

  return {
    purchaseOrders,
    loading,
    createPurchaseOrder,
    updatePurchaseOrder,
    receivePurchaseOrder,
    cancelPurchaseOrder,
    refetch: fetchPurchaseOrders,
  };
}
