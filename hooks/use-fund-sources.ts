'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FundSourceWithBranch,
    FundSourceFilters,
    CreateFundSourceInput,
    UpdateFundSourceInput,
    FundTransactionFilters,
    CreateFundTransferInput,
    FundTransferFilters,
    FundSourceDashboardData,
} from '@/types/fund-source.types';

const API_BASE = '/api/fund-sources';
const TRANSFER_API = '/api/fund-transfers';

// Fetch all fund sources
export function useFundSources(filters?: FundSourceFilters) {
    const params = new URLSearchParams();
    if (filters?.branchId) params.set('branchId', filters.branchId);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);

    return useQuery({
        queryKey: ['fund-sources', filters],
        queryFn: async (): Promise<FundSourceWithBranch[]> => {
            const res = await fetch(`${API_BASE}?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch fund sources');
            return res.json();
        },
    });
}

// Fetch single fund source
export function useFundSource(id: string | null) {
    return useQuery({
        queryKey: ['fund-source', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await fetch(`${API_BASE}/${id}`);
            if (!res.ok) throw new Error('Failed to fetch fund source');
            return res.json();
        },
        enabled: !!id,
    });
}

// Fetch fund sources summary/dashboard
export function useFundSourcesSummary(branchId?: string) {
    const params = new URLSearchParams();
    if (branchId) params.set('branchId', branchId);

    return useQuery<FundSourceDashboardData>({
        queryKey: ['fund-sources-summary', branchId],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/summary?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch fund sources summary');
            return res.json();
        },
    });
}

// Fetch fund source transactions
export function useFundSourceTransactions(
    fundSourceId: string | null,
    filters?: FundTransactionFilters
) {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.referenceType) params.set('referenceType', filters.referenceType);
    if (filters?.fromDate) params.set('fromDate', filters.fromDate.toISOString());
    if (filters?.toDate) params.set('toDate', filters.toDate.toISOString());
    if (filters?.page) params.set('page', filters.page.toString());
    if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());

    return useQuery({
        queryKey: ['fund-source-transactions', fundSourceId, filters],
        queryFn: async () => {
            if (!fundSourceId) return null;
            const res = await fetch(`${API_BASE}/${fundSourceId}/transactions?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');
            return res.json();
        },
        enabled: !!fundSourceId,
    });
}

// Fetch fund transfers
export function useFundTransfers(filters?: FundTransferFilters) {
    const params = new URLSearchParams();
    if (filters?.fromFundSourceId) params.set('fromFundSourceId', filters.fromFundSourceId);
    if (filters?.toFundSourceId) params.set('toFundSourceId', filters.toFundSourceId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.fromDate) params.set('fromDate', filters.fromDate.toISOString());
    if (filters?.toDate) params.set('toDate', filters.toDate.toISOString());

    return useQuery({
        queryKey: ['fund-transfers', filters],
        queryFn: async () => {
            const res = await fetch(`${TRANSFER_API}?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch fund transfers');
            return res.json();
        },
    });
}

// Create fund source mutation
export function useCreateFundSource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateFundSourceInput) => {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create fund source');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fund-sources'] });
            queryClient.invalidateQueries({ queryKey: ['fund-sources-summary'] });
        },
    });
}

// Update fund source mutation
export function useUpdateFundSource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateFundSourceInput }) => {
            const res = await fetch(`${API_BASE}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update fund source');
            }
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['fund-sources'] });
            queryClient.invalidateQueries({ queryKey: ['fund-source', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['fund-sources-summary'] });
        },
    });
}

// Delete fund source mutation
export function useDeleteFundSource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_BASE}/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete fund source');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fund-sources'] });
            queryClient.invalidateQueries({ queryKey: ['fund-sources-summary'] });
        },
    });
}

// Record manual transaction mutation
export function useRecordFundTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            fundSourceId,
            type,
            amount,
            description,
        }: {
            fundSourceId: string;
            type: 'DEPOSIT' | 'WITHDRAWAL';
            amount: number;
            description?: string;
        }) => {
            const res = await fetch(`${API_BASE}/${fundSourceId}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, amount, description }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to record transaction');
            }
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['fund-sources'] });
            queryClient.invalidateQueries({ queryKey: ['fund-source', variables.fundSourceId] });
            queryClient.invalidateQueries({ queryKey: ['fund-source-transactions', variables.fundSourceId] });
            queryClient.invalidateQueries({ queryKey: ['fund-sources-summary'] });
        },
    });
}

// Adjust balance mutation
export function useAdjustFundBalance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            fundSourceId,
            newBalance,
            reason,
        }: {
            fundSourceId: string;
            newBalance: number;
            reason: string;
        }) => {
            const res = await fetch(`${API_BASE}/${fundSourceId}/adjust`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newBalance, reason }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to adjust balance');
            }
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['fund-sources'] });
            queryClient.invalidateQueries({ queryKey: ['fund-source', variables.fundSourceId] });
            queryClient.invalidateQueries({ queryKey: ['fund-source-transactions', variables.fundSourceId] });
            queryClient.invalidateQueries({ queryKey: ['fund-sources-summary'] });
        },
    });
}

// Create fund transfer mutation
export function useCreateFundTransfer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Omit<CreateFundTransferInput, 'createdById'>) => {
            const res = await fetch(TRANSFER_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create transfer');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fund-sources'] });
            queryClient.invalidateQueries({ queryKey: ['fund-transfers'] });
            queryClient.invalidateQueries({ queryKey: ['fund-sources-summary'] });
        },
    });
}
