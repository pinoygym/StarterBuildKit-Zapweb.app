import { useQuery } from '@tanstack/react-query';
import { ProductCategory } from '@prisma/client';

interface UseProductCategoriesOptions {
  status?: 'active' | 'inactive' | 'all';
}

interface ProductCategoriesResponse {
  success: boolean;
  data: ProductCategory[];
  error?: string;
}

async function fetchProductCategories(status?: string): Promise<ProductCategory[]> {
  const params = new URLSearchParams();
  if (status && status !== 'all') {
    params.append('status', status);
  }

  const url = `/api/data-maintenance/product-categories${params.toString() ? `?${params.toString()}` : ''}${params.toString() ? '&' : '?'}v=${Date.now()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch product categories');
  }

  const result: ProductCategoriesResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch product categories');
  }

  // Sort by displayOrder, then by name
  return result.data.sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    return a.name.localeCompare(b.name);
  });
}

export function useProductCategories(options: UseProductCategoriesOptions = {}) {
  const { status = 'active' } = options;

  return useQuery({
    queryKey: ['product-categories', status],
    queryFn: () => fetchProductCategories(status),
    staleTime: 0, // Always fetch fresh data to ensure new categories appear immediately
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
