'use client';

import { useState } from 'react';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { useAuth } from '@/contexts/auth.context';
import { AuditLogTable } from '@/components/settings/audit-log-table';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, RotateCcw, ShieldAlert } from 'lucide-react';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { AuditLogFilters } from '@/types/audit.types';
import { PaginationControls } from '@/components/shared/pagination-controls';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AuditLogsPage() {
    const { isSuperMegaAdmin, isLoading: authLoading } = useAuth();
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [filters, setFilters] = useState<AuditLogFilters>({});

    const { data, isLoading } = useAuditLogs(filters, page, limit);

    // Show loading state while checking authentication
    if (authLoading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Audit Logs"
                    description="Monitor and track system activities and user actions"
                />
                <TableSkeleton rows={10} />
            </div>
        );
    }

    // Check if user is super admin
    if (!isSuperMegaAdmin()) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Audit Logs"
                    description="Monitor and track system activities and user actions"
                />
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You do not have permission to view audit logs. This page is restricted to Super Admins only.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const resetFilters = () => {
        setFilters({});
        setPage(1);
    };

    const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value || undefined }));
        setPage(1);
    };

    const resources = [
        'PRODUCT', 'SUPPLIER', 'CUSTOMER', 'INVENTORY_ADJUSTMENT', 'PURCHASE_ORDER',
        'SALES_ORDER', 'RECEIVING_VOUCHER', 'USER', 'ROLE', 'BRANCH', 'WAREHOUSE'
    ];

    const actions = [
        'CREATE', 'UPDATE', 'DELETE', 'POST', 'CANCEL', 'COPY', 'REVERSE', 'USER_LOGIN', 'USER_LOGOUT'
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Audit Logs"
                description="Monitor and track system activities and user actions"
            />

            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <Select
                            value={filters.resource || 'all'}
                            onValueChange={(val) => handleFilterChange('resource', val === 'all' ? undefined : val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Resources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Resources</SelectItem>
                                {resources.map(res => (
                                    <SelectItem key={res} value={res}>{res}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <Select
                            value={filters.action || 'all'}
                            onValueChange={(val) => handleFilterChange('action', val === 'all' ? undefined : val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                {actions.map(action => (
                                    <SelectItem key={action} value={action}>{action}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="outline" onClick={resetFilters}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <TableSkeleton rows={10} />
            ) : (
                <div className="space-y-4">
                    <AuditLogTable logs={data?.data || []} />

                    {data && data.pagination && (
                        <PaginationControls
                            page={page}
                            limit={limit}
                            totalCount={data.pagination.total}
                            onPageChange={setPage}
                            onLimitChange={() => { }} // limit is readonly in this component
                            loading={false}
                            itemName="entries"
                        />
                    )}
                </div>
            )}
        </div>
    );
}
