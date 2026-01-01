import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Customer } from '@prisma/client';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilters,
  CustomerWithRelations,
} from '@/types/customer.types';

const API_BASE_URL = '/api/customers';

// Fetch all customers
async function fetchCustomers(filters?: CustomerFilters): Promise<CustomerWithRelations[]> {
  const params = new URLSearchParams();
  
  if (filters?.status) params.append('status', filters.status);
  if (filters?.customerType) params.append('customerType', filters.customerType);
  if (filters?.search) params.append('search', filters.search);

  const url = `${API_BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  
  const data = await response.json();
  return data.data;
}

// Fetch single customer
async function fetchCustomer(id: string): Promise<CustomerWithRelations> {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch customer');
  }
  
  const data = await response.json();
  return data.data;
}

// Create customer
async function createCustomer(customerData: CreateCustomerInput): Promise<Customer> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create customer');
  }
  
  const data = await response.json();
  return data.data;
}

// Update customer
async function updateCustomer(id: string, customerData: UpdateCustomerInput): Promise<Customer> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update customer');
  }
  
  const data = await response.json();
  return data.data;
}

// Delete customer
async function deleteCustomer(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete customer');
  }
}

// Hooks
export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => fetchCustomers(filters),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => fetchCustomer(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerInput }) =>
      updateCustomer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update customer');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete customer');
    },
  });
}
