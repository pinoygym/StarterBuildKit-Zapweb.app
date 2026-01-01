'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { AdjustmentSlipForm } from '@/components/inventory/adjustment-slip-form';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useProducts } from '@/hooks/use-products';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { toast } from '@/hooks/use-toast';

export function NewAdjustmentContent() {
    const router = useRouter();
    const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
    const { products, loading: productsLoading } = useProducts();

    const handleSubmit = async (data: any) => {
        try {
            const response = await fetch('/api/inventory/adjust/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Stock adjustment completed successfully',
                });
                router.push('/inventory');
                return true;
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to adjust stock',
                    variant: 'destructive',
                });
                return false;
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
            return false;
        }
    };

    const handleCancel = () => {
        router.push('/inventory');
    };

    if (warehousesLoading || productsLoading) {
        return (
            <div className="p-6">
                <PageHeader
                    title="New Adjustment Slip"
                    description="Adjust inventory for multiple items"
                />
                <TableSkeleton />
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader
                title="New Adjustment Slip"
                description="Adjust inventory for multiple items in a warehouse"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Inventory', href: '/inventory' },
                    { label: 'New Adjustment' },
                ]}
            />

            <AdjustmentSlipForm
                warehouses={warehouses || []}
                products={products || []}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </div>
    );
}
