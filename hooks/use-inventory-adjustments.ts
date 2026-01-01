import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    InventoryAdjustmentWithRelations,
    CreateAdjustmentInput,
    UpdateAdjustmentInput,
    AdjustmentFilters
} from '@/types/inventory-adjustment.types';
import { toast } from 'sonner';

interface InventoryAdjustmentsApiResponse {
    success: boolean;
    data: InventoryAdjustmentWithRelations[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    error?: string;
}

interface InventoryAdjustmentResponse {
    success: boolean;
    data: InventoryAdjustmentWithRelations;
    error?: string;
}

/**
 * Hook to fetch list of inventory adjustments
 */
export function useInventoryAdjustments(filters?: AdjustmentFilters & { page?: number; limit?: number | 'all' }) {
    return useQuery({
        queryKey: ['inventory-adjustments', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
            if (filters?.branchId) params.append('branchId', filters.branchId);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.searchQuery) params.append('searchQuery', filters.searchQuery);
            if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
            if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());

            // Pagination
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());

            const response = await fetch(`/api/inventory/adjustments?${params.toString()}`);
            const result: InventoryAdjustmentsApiResponse = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch adjustments');
            }

            return { data: result.data, meta: result.meta };
        },
    });
}

/**
 * Hook to fetch a single inventory adjustment
 */
export function useInventoryAdjustment(id: string) {
    return useQuery({
        queryKey: ['inventory-adjustment', id],
        queryFn: async () => {
            const response = await fetch(`/api/inventory-adjustments/${id}`);
            const result: InventoryAdjustmentResponse = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch adjustment');
            }

            return result.data;
        },
        enabled: !!id,
    });
}

/**
 * Mutation to create a new adjustment
 */
export function useCreateInventoryAdjustment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateAdjustmentInput) => {
            const response = await fetch('/api/inventory-adjustments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result: InventoryAdjustmentResponse = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to create adjustment');
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-adjustments'] });
            toast.success('Adjustment created successfully');
        },
        onError: (error: Error) => {
            toast.error(`Error creating adjustment: ${error.message}`);
        },
    });
}

/**
 * Mutation to update an adjustment
 */
export function useUpdateInventoryAdjustment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateAdjustmentInput }) => {
            const response = await fetch(`/api/inventory-adjustments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result: InventoryAdjustmentResponse = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to update adjustment');
            return result.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-adjustments'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-adjustment', data.id] });
            toast.success('Adjustment updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Error updating adjustment: ${error.message}`);
        },
    });
}

/**
 * Mutation to post (finalize) an adjustment
 */
export function usePostInventoryAdjustment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/inventory-adjustments/${id}/post`, {
                method: 'POST',
            });
            const result: InventoryAdjustmentResponse & { details?: any; backup?: any } = await response.json();
            if (!result.success) {
                const error = new Error(result.error || 'Failed to post adjustment') as any;
                error.details = result.details;
                throw error;
            }

            // If backup was created, download it automatically
            if (result.backup) {
                try {
                    const filename = result.backup._filename || `backup_${new Date().toISOString()}.json`;

                    // Remove metadata fields before creating the backup file
                    const { _filename, _reason, ...backupData } = result.backup;

                    // Create blob and download
                    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    console.log(`[Auto-Backup] Downloaded backup: ${filename}`);
                } catch (backupError) {
                    console.error('[Auto-Backup] Failed to download backup:', backupError);
                    // Don't fail the entire operation if backup download fails
                }
            }

            return result.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-adjustments'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-adjustment', data.id] });
            toast.success('Adjustment posted successfully. Backup downloaded automatically.');
        },
        onError: (error: any) => {
            console.error('Full POST error:', error);
            console.error('Error Message:', error.message);
            const details = error.details ? `: ${JSON.stringify(error.details)}` : '';
            toast.error(`Error posting adjustment: ${error.message}${details}`);
            console.error('Post adjustment error details:', error.details);
        },
    });
}

/**
 * Mutation to copy an adjustment
 */
export function useCopyInventoryAdjustment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/inventory-adjustments/${id}/copy`, {
                method: 'POST',
            });
            const result: InventoryAdjustmentResponse = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to copy adjustment');
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-adjustments'] });
            toast.success('Adjustment copied successfully');
        },
        onError: (error: Error) => {
            toast.error(`Error copying adjustment: ${error.message}`);
        },
    });
}

/**
 * Mutation to reverse an adjustment
 */
export function useReverseInventoryAdjustment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/inventory-adjustments/${id}/reverse`, {
                method: 'POST',
            });
            const result: InventoryAdjustmentResponse = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to reverse adjustment');
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-adjustments'] });
            toast.success('Adjustment reversal created successfully');
        },
        onError: (error: Error) => {
            toast.error(`Error reversing adjustment: ${error.message}`);
        },
    });
}
