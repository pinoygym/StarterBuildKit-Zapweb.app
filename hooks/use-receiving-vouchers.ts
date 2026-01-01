import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ReceivingVoucherWithDetails,
  CreateReceivingVoucherInput,
  ReceivingVoucherFilters,
  VarianceReport,
} from '@/types/receiving-voucher.types';

// Fetch all receiving vouchers with filters
export function useReceivingVouchers(filters?: ReceivingVoucherFilters) {
  return useQuery({
    queryKey: ['receiving-vouchers', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
      if (filters?.supplierId) params.append('supplierId', filters.supplierId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters?.rvNumber) params.append('rvNumber', filters.rvNumber);
      if (filters?.poNumber) params.append('poNumber', filters.poNumber);

      const response = await fetch(`/api/receiving-vouchers?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch receiving vouchers');
      const data = await response.json();
      return data.data as ReceivingVoucherWithDetails[];
    },
  });
}

// Fetch single receiving voucher by ID
export function useReceivingVoucherDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['receiving-voucher', id],
    queryFn: async () => {
      if (!id) throw new Error('ID is required');
      const response = await fetch(`/api/receiving-vouchers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch receiving voucher');
      const data = await response.json();
      return data.data as ReceivingVoucherWithDetails;
    },
    enabled: !!id,
  });
}

// Fetch receiving vouchers for a purchase order
export function usePOReceivingVouchers(poId: string | undefined) {
  return useQuery({
    queryKey: ['po-receiving-vouchers', poId],
    queryFn: async () => {
      if (!poId) throw new Error('PO ID is required');
      const response = await fetch(`/api/purchase-orders/${poId}/receiving-vouchers`);
      if (!response.ok) throw new Error('Failed to fetch receiving vouchers');
      const data = await response.json();
      return data.data as ReceivingVoucherWithDetails[];
    },
    enabled: !!poId,
  });
}

// Fetch variance report
export function useVarianceReport(filters?: Pick<ReceivingVoucherFilters, 'branchId' | 'startDate' | 'endDate'>) {
  return useQuery({
    queryKey: ['variance-report', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/reports/receiving-variance?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch variance report');
      const data = await response.json();
      return data.data as VarianceReport[];
    },
  });
}

// Create receiving voucher mutation
export function useCreateReceivingVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReceivingVoucherInput) => {
      const response = await fetch('/api/receiving-vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create receiving voucher');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Receiving voucher created successfully');
      queryClient.invalidateQueries({ queryKey: ['receiving-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create receiving voucher');
    },
  });
}
