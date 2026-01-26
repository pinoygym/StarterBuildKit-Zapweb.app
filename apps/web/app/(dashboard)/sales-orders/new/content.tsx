'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { SalesOrderForm } from '@/components/sales-orders/sales-order-form';
import { useSalesOrders } from '@/hooks/use-sales-orders';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useBranches } from '@/hooks/use-branches';
import { useProducts } from '@/hooks/use-products';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { useBranch } from '@/hooks/use-branch';

export function NewSalesOrderContent() {
    const router = useRouter();
    const { createSalesOrder } = useSalesOrders();
    const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
    const { data: branches, isLoading: branchesLoading } = useBranches();
    const { products, loading: productsLoading } = useProducts();
    const { selectedBranch } = useBranch();

    const handleSubmit = async (data: any) => {
        // The form data needs to be passed to the create function.
        // Ensure the data structure matches what key expectations are.
        // The useSalesOrders hook's createSalesOrder likely takes the exact input object.
        const result = await createSalesOrder(data);
        if (result?.success) { // Assuming createSalesOrder returns { success: boolean } or similar
            router.push('/sales-orders');
            return true;
        }
        return false;
    };

    const handleCancel = () => {
        router.push('/sales-orders');
    };

    if (warehousesLoading || branchesLoading || productsLoading) {
        return (
            <div className="p-6">
                <PageHeader
                    title="Create Sales Order"
                    description="Create a new sales order"
                />
                <TableSkeleton />
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader
                title="Create Sales Order"
                description="Create a new sales order for customer"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Sales Orders', href: '/sales-orders' },
                    { label: 'New' },
                ]}
            />

            <SalesOrderForm
                warehouses={warehouses || []}
                branches={branches || []}
                products={products || []}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                activeBranchId={selectedBranch?.id}
            />
        </div>
    );
}
