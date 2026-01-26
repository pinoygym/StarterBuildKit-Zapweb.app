import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    InventoryTransferWithRelations,
    CreateTransferInput,
    UpdateTransferInput,
    TransferFilters
} from '@/types/inventory-transfer.types';
import { toast } from 'sonner';

interface InventoryTransfersApiResponse {
    success: boolean;
    data: InventoryTransferWithRelations[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    error?: string;
}

interface InventoryTransferResponse {
    success: boolean;
    data: InventoryTransferWithRelations;
    error?: string;
}

/**
 * Hook to fetch list of inventory transfers
 */
export function useInventoryTransfers(filters?: TransferFilters) {
    return useQuery({
        queryKey: ['inventory-transfers', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.sourceWarehouseId) params.append('sourceWarehouseId', filters.sourceWarehouseId);
            if (filters?.destinationWarehouseId) params.append('destinationWarehouseId', filters.destinationWarehouseId);
            if (filters?.branchId) params.append('branchId', filters.branchId);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.searchQuery) params.append('searchQuery', filters.searchQuery);
            if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
            if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());

            const response = await fetch(`/api/inventory/transfers?${params.toString()}`);
            const result: InventoryTransfersApiResponse = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch transfers');
            }

            return { data: result.data, meta: result.meta };
        },
    });
}

/**
 * Hook to fetch a single inventory transfer
 */
export function useInventoryTransfer(id: string) {
    return useQuery({
        queryKey: ['inventory-transfer', id],
        queryFn: async () => {
            const response = await fetch(`/api/inventory/transfers/${id}`);
            const result: InventoryTransferResponse = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch transfer');
            }

            return result.data;
        },
        enabled: !!id,
    });
}

/**
 * Mutation to create a new transfer (Draft)
 */
export function useCreateInventoryTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateTransferInput) => {
            const response = await fetch('/api/inventory/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result: InventoryTransferResponse = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to create transfer');
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-transfers'] });
            toast.success('Transfer draft created successfully');
        },
        onError: (error: Error) => {
            toast.error(`Error creating transfer: ${error.message}`);
        },
    });
}

/**
 * Mutation to update a transfer (Draft)
 */
export function useUpdateInventoryTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateTransferInput }) => {
            const response = await fetch(`/api/inventory/transfers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result: InventoryTransferResponse = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to update transfer');
            return result.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-transfers'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-transfer', data.id] });
            toast.success('Transfer draft updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Error updating transfer: ${error.message}`);
        },
    });
}

/**
 * Mutation to delete a transfer (Draft)
 */
export function useDeleteInventoryTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/inventory/transfers/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to delete transfer');
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-transfers'] });
            toast.success('Transfer deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(`Error deleting transfer: ${error.message}`);
        },
    });
}

/**
 * Mutation to post a transfer (Apply to inventory)
 */
export function usePostInventoryTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/inventory/transfers/${id}/post`, {
                method: 'POST',
            });
            const result: InventoryTransferResponse = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to post transfer');
            return result.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-transfers'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-transfer', data.id] });
            toast.success('Transfer posted successfully. Inventory updated.');
        },
        onError: (error: Error) => {
            toast.error(`Error posting transfer: ${error.message}`);
        },
    });
}
