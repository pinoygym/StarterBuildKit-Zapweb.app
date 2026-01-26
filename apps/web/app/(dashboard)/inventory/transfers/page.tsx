'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/shared/pagination-controls';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { TransfersTable } from '@/components/inventory/transfers-table';
import { useInventoryTransfers } from '@/hooks/use-inventory-transfers';
import { useWarehouses } from '@/hooks/use-warehouses';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Package } from 'lucide-react';
import { TransferStatus } from '@/types/inventory-transfer.types';

export default function TransfersPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    const { data: warehouses } = useWarehouses();

    const { data: response, isLoading, error } = useInventoryTransfers({
        sourceWarehouseId: warehouseFilter !== 'all' ? warehouseFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter as TransferStatus : undefined,
        searchQuery: searchQuery || undefined,
        page,
        limit,
    });

    const transfers = response?.data || [];
    const meta = response?.meta;

    const handleNewTransfer = () => {
        router.push('/inventory/transfers/new');
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    if (error) {
        return (
            <div className="p-6">
                <PageHeader
                    title="Stock Transfers"
                    description="Manage and track stock transfers"
                />
                <div className="text-center py-8 text-destructive">
                    Error loading transfers: {error.message}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader
                title="Stock Transfers"
                description="View and manage all stock transfer slips"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Inventory', href: '/inventory' },
                    { label: 'Transfers' },
                ]}
                actions={
                    <Button onClick={handleNewTransfer}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Transfer Slip
                    </Button>
                }
            />

            {/* Search and Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by reference number, transfer number, or reason..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="w-full md:w-[200px]">
                            <Select
                                value={statusFilter}
                                onValueChange={(val) => {
                                    setStatusFilter(val);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="POSTED">Posted</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Warehouse Filter */}
                        <div className="w-full md:w-[200px]">
                            <Select
                                value={warehouseFilter}
                                onValueChange={(val) => {
                                    setWarehouseFilter(val);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="All Warehouses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Warehouses</SelectItem>
                                    {(warehouses || []).map((warehouse) => (
                                        <SelectItem key={warehouse.id} value={warehouse.id}>
                                            {warehouse.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transfers Table */}
            {isLoading ? (
                <TableSkeleton />
            ) : !transfers || transfers.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title="No transfers found"
                    description={
                        searchQuery || warehouseFilter !== 'all' || statusFilter !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Create your first transfer slip to get started'
                    }
                    actionLabel="New Transfer Slip"
                    onAction={handleNewTransfer}
                />
            ) : (
                <>
                    <TransfersTable transfers={transfers} loading={isLoading} />

                    {/* Pagination Controls */}
                    {meta && (
                        <div className="mt-4">
                            <PaginationControls
                                page={page}
                                limit={limit}
                                totalCount={meta.total}
                                onPageChange={handlePageChange}
                                onLimitChange={(newLimit) => {
                                    setLimit(newLimit);
                                    setPage(1);
                                }}
                                loading={isLoading}
                                itemName="transfers"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
