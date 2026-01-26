import { useQuery } from '@tanstack/react-query';

interface StockLevelData {
    productId: string;
    warehouseId: string;
    quantity: number;
}

interface UseStockLevelOptions {
    enabled?: boolean;
}

export function useStockLevel(
    productId: string | undefined,
    warehouseId: string | undefined,
    options?: UseStockLevelOptions
) {
    return useQuery({
        queryKey: ['stock-level', productId, warehouseId],
        queryFn: async () => {
            if (!productId || !warehouseId) {
                return null;
            }

            const response = await fetch(
                `/api/inventory/stock-level?productId=${productId}&warehouseId=${warehouseId}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch stock level');
            }

            const result = await response.json();
            return result.data as StockLevelData;
        },
        enabled: options?.enabled !== false && !!productId && !!warehouseId,
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 60000, // Keep in cache for 1 minute
    });
}
