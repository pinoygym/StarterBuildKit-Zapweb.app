'use client';

import { useState, useEffect } from 'react';
import { WarehouseWithUtilization } from '@/types/warehouse.types';

export function useWarehouses(branchId?: string) {
  const [warehouses, setWarehouses] = useState<WarehouseWithUtilization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const url = branchId
        ? `/api/warehouses?branchId=${branchId}`
        : '/api/warehouses';
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setWarehouses(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch warehouses');
      }
    } catch (err) {
      setError('Failed to fetch warehouses');
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [branchId]);

  const createWarehouse = async (data: any) => {
    const response = await fetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      await fetchWarehouses();
    }

    return result;
  };

  const updateWarehouse = async (id: string, data: any) => {
    const response = await fetch(`/api/warehouses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      await fetchWarehouses();
    }

    return result;
  };

  const deleteWarehouse = async (id: string) => {
    const response = await fetch(`/api/warehouses/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      await fetchWarehouses();
    }

    return result;
  };

  const getWarehouseDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/warehouses/${id}`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch warehouse details');
      }
    } catch (err) {
      console.error('Error fetching warehouse details:', err);
      throw err;
    }
  };

  return {
    warehouses,
    loading,
    error,
    refetch: fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseDetails,
  };
}
