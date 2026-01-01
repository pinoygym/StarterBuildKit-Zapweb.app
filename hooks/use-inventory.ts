import { useState, useEffect } from 'react';
import { BatchWithRelations, BatchFilters, StockLevel } from '@/types/inventory.types';
import { toast } from '@/hooks/use-toast';

export function useInventory(filters?: BatchFilters) {
  const [batches, setBatches] = useState<BatchWithRelations[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.productId) params.append('productId', filters.productId);
      if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.expiryDateFrom) params.append('expiryDateFrom', filters.expiryDateFrom.toISOString());
      if (filters?.expiryDateTo) params.append('expiryDateTo', filters.expiryDateTo.toISOString());

      const response = await fetch(`/api/inventory?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setBatches(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch inventory',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch inventory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStockLevels = async (warehouseId?: string) => {
    try {
      const params = new URLSearchParams();
      if (warehouseId) params.append('warehouseId', warehouseId);

      const response = await fetch(`/api/inventory/stock-levels?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setStockLevels(data.data);
      }
    } catch (error) {
      console.error('Error fetching stock levels:', error);
    }
  };

  const addStock = async (data: any) => {
    try {
      const response = await fetch('/api/inventory/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Stock added successfully',
        });
        await fetchBatches();
        return true;
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add stock',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to add stock',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deductStock = async (data: any) => {
    try {
      const response = await fetch('/api/inventory/deduct-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Stock deducted successfully',
        });
        await fetchBatches();
        return true;
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to deduct stock',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error deducting stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to deduct stock',
        variant: 'destructive',
      });
      return false;
    }
  };

  const transferStock = async (data: any) => {
    try {
      const response = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Stock transferred successfully',
        });
        await fetchBatches();
        return true;
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to transfer stock',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error transferring stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to transfer stock',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [filters?.productId, filters?.warehouseId, filters?.status, filters?.expiryDateFrom, filters?.expiryDateTo]);

  return {
    batches,
    stockLevels,
    loading,
    addStock,
    deductStock,
    transferStock,
    refetch: fetchBatches,
    fetchStockLevels,
  };
}
