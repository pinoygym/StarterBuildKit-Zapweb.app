import { useStockLevel } from '@/hooks/use-stock-level';
import { Loader2 } from 'lucide-react';

interface OnHandQuantityDisplayProps {
    productId: string | undefined;
    warehouseId: string | undefined;
    baseUOM: string | undefined;
}

export function OnHandQuantityDisplay({
    productId,
    warehouseId,
    baseUOM,
}: OnHandQuantityDisplayProps) {
    const { data, isLoading, error } = useStockLevel(productId, warehouseId);

    if (!productId || !warehouseId) {
        return <span className="text-xs text-muted-foreground">-</span>;
    }

    if (isLoading) {
        return (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
            </span>
        );
    }

    if (error) {
        return <span className="text-xs text-destructive">Error</span>;
    }

    const quantity = data?.quantity ?? 0;
    const uom = baseUOM || '';

    return (
        <span className={`text-xs font-medium ${quantity > 0 ? 'text-green-600' : 'text-orange-600'}`}>
            {quantity.toLocaleString()} {uom}
        </span>
    );
}
