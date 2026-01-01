import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Custom hook for fetching data with React Query
 * Provides automatic caching, refetching, and error handling
 */
export function useApiQuery<T>(
  queryKey: string[],
  fetcher: () => Promise<ApiResponse<T>>,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetcher();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch data');
      }
      return response.data as T;
    },
    ...options,
  });
}

/**
 * Custom hook for mutations with React Query
 * Provides optimistic updates, automatic cache invalidation, and error handling
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: {
    onSuccessMessage?: string;
    onErrorMessage?: string;
    invalidateQueries?: string[][];
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  } & Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await mutationFn(variables);
      if (!response.success) {
        throw new Error(response.error?.message || 'Mutation failed');
      }
      return response.data as TData;
    },
    onSuccess: (data: TData) => {
      // Show success toast
      if (options?.onSuccessMessage) {
        toast.success(options.onSuccessMessage);
      }

      // Invalidate queries to refetch data
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Call custom onSuccess handler
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      // Show error toast
      const errorMessage = options?.onErrorMessage || error.message || 'An error occurred';
      toast.error(errorMessage);

      // Call custom onError handler
      options?.onError?.(error);
    },
    ...options,
  });
}

/**
 * Helper function to build API URL with query parameters
 */
export function buildApiUrl(path: string, params?: Record<string, any>): string {
  const url = new URL(path, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Helper function for fetching API data
 */
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || 'Network error occurred',
        code: 'NETWORK_ERROR',
      },
    };
  }
}
