'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { WarehouseWithUtilization } from '@/types/warehouse.types';

const API_BASE_URL = '/api/warehouses';

// Fetch all warehouses
async function fetchWarehouses(branchId?: string): Promise<WarehouseWithUtilization[]> {
  const url = branchId
    ? `${API_BASE_URL}?branchId=${branchId}`
    : API_BASE_URL;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch warehouses');
  }

  const data = await response.json();
  return data.data;
}

// Fetch single warehouse
async function fetchWarehouse(id: string): Promise<WarehouseWithUtilization> {
  const response = await fetch(`${API_BASE_URL}/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch warehouse');
  }

  const data = await response.json();
  return data.data;
}

// Create warehouse
async function createWarehouse(warehouseData: any): Promise<WarehouseWithUtilization> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(warehouseData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create warehouse');
  }

  const data = await response.json();
  return data.data;
}

// Update warehouse
async function updateWarehouse(id: string, warehouseData: any): Promise<WarehouseWithUtilization> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(warehouseData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update warehouse');
  }

  const data = await response.json();
  return data.data;
}

// Delete warehouse
async function deleteWarehouse(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete warehouse');
  }
}

// Hooks
export function useWarehouses(branchId?: string) {
  return useQuery({
    queryKey: ['warehouses', branchId],
    queryFn: () => fetchWarehouses(branchId),
  });
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: ['warehouses', id],
    queryFn: () => fetchWarehouse(id),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create warehouse');
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateWarehouse(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses', variables.id] });
      toast.success('Warehouse updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update warehouse');
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete warehouse');
    },
  });
}
