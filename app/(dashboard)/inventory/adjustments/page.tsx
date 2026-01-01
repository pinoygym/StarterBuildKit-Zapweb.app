'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AdjustmentsTable } from '@/components/inventory/adjustments-table';
import { useInventoryAdjustments } from '@/hooks/use-inventory-adjustments';
import { useWarehouses } from '@/hooks/use-warehouses';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Package } from 'lucide-react';
import { AdjustmentStatus } from '@/types/inventory-adjustment.types';

export default function AdjustmentsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data: warehouses } = useWarehouses();

    const { data: adjustments, isLoading, error } = useInventoryAdjustments({
        warehouseId: warehouseFilter !== 'all' ? warehouseFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter as AdjustmentStatus : undefined,
        searchQuery: searchQuery || undefined,
    });

    const handleNewAdjustment = () => {
        router.push('/inventory/adjustments/new');
    };

    if (error) {
        return (
            <div className="p-6">
                <PageHeader
                    title="Inventory Adjustments"
                    description="Manage and track inventory adjustments"
                />
                <div className="text-center py-8 text-destructive">
                    Error loading adjustments: {error.message}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader
                title="Inventory Adjustments"
                description="View and manage all inventory adjustment slips"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Inventory', href: '/inventory' },
                    { label: 'Adjustments' },
                ]}
                actions={
                    <Button onClick={handleNewAdjustment}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Adjustment Slip
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
                                placeholder="Search by reference number, adjustment number, or reason..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="w-full md:w-[200px]">
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
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
                                onValueChange={setWarehouseFilter}
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

            {/* Adjustments Table */}
            {isLoading ? (
                <TableSkeleton />
            ) : !adjustments || adjustments.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title="No adjustments found"
                    description={
                        searchQuery || warehouseFilter !== 'all' || statusFilter !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Create your first adjustment slip to get started'
                    }
                    action={
                        <Button onClick={handleNewAdjustment}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Adjustment Slip
                        </Button>
                    }
                />
            ) : (
                <AdjustmentsTable adjustments={adjustments} loading={isLoading} />
            )}
        </div>
    );
}
