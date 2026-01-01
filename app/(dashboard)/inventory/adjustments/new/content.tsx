'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { AdjustmentForm, AdjustmentFormData } from '@/components/inventory/adjustment-form';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useBranches } from '@/hooks/use-branches';
import { useProducts } from '@/hooks/use-products';
import { useCreateInventoryAdjustment } from '@/hooks/use-inventory-adjustments';
import { TableSkeleton } from '@/components/shared/loading-skeleton';

export function NewAdjustmentContent() {
    const router = useRouter();
    const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
    const { data: branches, isLoading: branchesLoading } = useBranches();
    const { products, loading: productsLoading } = useProducts();
    const { mutateAsync: createAdjustment, isPending: isCreating } = useCreateInventoryAdjustment();

    const handleSubmit = async (data: AdjustmentFormData) => {
        try {
            const formattedData = {
                ...data,
                items: data.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    uom: item.uom,
                    type: item.type,
                }))
            };

            await createAdjustment(formattedData);
            router.push('/inventory/adjustments');
        } catch (error) {
            // Error handling is managed by the hook's toast
        }
    };

    const handleCancel = () => {
        router.push('/inventory/adjustments');
    };

    if (warehousesLoading || branchesLoading || productsLoading) {
        return (
            <div className="p-6">
                <PageHeader
                    title="New Adjustment Slip"
                    description="Create a new inventory adjustment draft"
                />
                <TableSkeleton />
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader
                title="New Adjustment Slip"
                description="Create a new inventory adjustment draft"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Inventory', href: '/inventory' },
                    { label: 'Adjustments', href: '/inventory/adjustments' },
                    { label: 'New' },
                ]}
            />

            <AdjustmentForm
                warehouses={warehouses || []}
                branches={branches || []}
                products={products || []}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isCreating}
            />
        </div>
    );
}
