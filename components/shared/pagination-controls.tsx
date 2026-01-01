import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface PaginationControlsProps {
    page: number;
    limit: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    loading?: boolean;
    itemName?: string;
    hasMore?: boolean;
}

export function PaginationControls({
    page,
    limit,
    totalCount,
    onPageChange,
    onLimitChange,
    loading = false,
    itemName = 'items',
    hasMore,
}: PaginationControlsProps) {
    const startItem = ((page - 1) * limit) + 1;
    const endItem = Math.min(page * limit, totalCount);
    const totalPages = Math.ceil(totalCount / limit);

    // Determine if there's a next page
    const hasNextPage = hasMore !== undefined ? hasMore : page < totalPages;

    if (totalCount === 0) {
        return null;
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {startItem} to {endItem} of {totalCount} {itemName}
            </div>

            <div className="flex items-center gap-2 order-1 sm:order-2">
                <div className="flex items-center gap-2 mr-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline">Rows per page</span>
                    <Select
                        value={limit.toString()}
                        onValueChange={(value) => onLimitChange(parseInt(value))}
                        disabled={loading}
                    >
                        <SelectTrigger className="w-[70px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page <= 1 || loading}
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(page + 1)}
                        disabled={!hasNextPage || loading}
                        aria-label="Next page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
