import { useState, useEffect } from 'react';
import { InventoryWithRelations, InventoryFilters } from '@/types/inventory.types';
import { toast } from '@/hooks/use-toast';

interface UseInventoryOptions extends InventoryFilters { }

export function useInventory(options?: UseInventoryOptions) {
  const [inventory, setInventory] = useState<InventoryWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (options?.productId) params.append('productId', options.productId);
      if (options?.warehouseId) params.append('warehouseId', options.warehouseId);

      const response = await fetch(`/api/inventory?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setInventory(data.data);
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
        await fetchInventory();
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
        await fetchInventory();
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
        await fetchInventory();
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
    fetchInventory();
  }, [options?.productId, options?.warehouseId]);

  return {
    inventory,
    loading,
    addStock,
    deductStock,
    transferStock,
    refetch: fetchInventory,
  };
}
