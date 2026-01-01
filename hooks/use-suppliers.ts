'use client';

import { useState, useEffect } from 'react';
import { Supplier } from '@prisma/client';
import { SupplierFilters } from '@/types/supplier.types';

export function useSuppliers(filters?: SupplierFilters) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      
      const queryString = params.toString();
      const url = `/api/suppliers${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setSuppliers(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch suppliers');
      }
    } catch (err) {
      setError('Failed to fetch suppliers');
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [filters?.status, filters?.search]);

  const createSupplier = async (data: any) => {
    const response = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (result.success) {
      await fetchSuppliers();
    }
    
    return result;
  };

  const updateSupplier = async (id: string, data: any) => {
    const response = await fetch(`/api/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (result.success) {
      await fetchSuppliers();
    }
    
    return result;
  };

  const deleteSupplier = async (id: string) => {
    const response = await fetch(`/api/suppliers/${id}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (result.success) {
      await fetchSuppliers();
    }
    
    return result;
  };

  return {
    suppliers,
    loading,
    error,
    refetch: fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}
