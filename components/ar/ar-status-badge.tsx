import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ARStatusBadgeProps {
    status: string;
    className?: string;
}

export function ARStatusBadge({ status, className }: ARStatusBadgeProps) {
    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
            case 'partial':
                return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200';
            case 'overdue':
                return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200';
        }
    };

    const formatStatus = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    return (
        <Badge
            variant="outline"
            className={cn(getStatusStyles(status), "font-medium", className)}
        >
            {formatStatus(status)}
        </Badge>
    );
}
