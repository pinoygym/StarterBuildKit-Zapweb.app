'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { TransferSlipForm, TransferFormData } from '@/components/inventory/transfer-slip-form';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useProducts } from '@/hooks/use-products';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { toast } from 'sonner';
import { useCreateInventoryTransfer, usePostInventoryTransfer } from '@/hooks/use-inventory-transfers';

export function NewTransferContent() {
    const router = useRouter();
    const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
    const { products, loading: productsLoading } = useProducts();
    const { mutateAsync: createTransfer } = useCreateInventoryTransfer();
    const { mutateAsync: postTransfer } = usePostInventoryTransfer();

    const handleSubmit = async (data: TransferFormData, isPost: boolean) => {
        try {
            const transfer = await createTransfer(data);

            if (isPost && transfer.id) {
                await postTransfer(transfer.id);
            }

            router.push('/inventory/transfers');
            return true;
        } catch (error: any) {
            // Error handled by hook toast
            return false;
        }
    };

    const handleCancel = () => {
        router.push('/inventory/transfers');
    };

    if (warehousesLoading || productsLoading) {
        return (
            <div className="p-6">
                <PageHeader
                    title="New Stock Transfer"
                    description="Transfer multiple items between warehouses"
                />
                <TableSkeleton />
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader
                title="New Stock Transfer"
                description="Transfer multiple items between warehouses"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Inventory', href: '/inventory' },
                    { label: 'Transfers', href: '/inventory/transfers' },
                    { label: 'New Transfer' },
                ]}
            />

            <TransferSlipForm
                warehouses={warehouses || []}
                products={products || []}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </div>
    );
}
