'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { SalesOrderForm } from '@/components/sales-orders/sales-order-form';
import { useSalesOrders } from '@/hooks/use-sales-orders';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useBranches } from '@/hooks/use-branches';
import { useProducts } from '@/hooks/use-products';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { SalesOrderWithItems } from '@/types/sales-order.types';
import { toast } from '@/hooks/use-toast';

interface EditSalesOrderPageProps {
    params: Promise<{ id: string }>;
}

export default function EditSalesOrderPage({ params }: EditSalesOrderPageProps) {
    const router = useRouter();
    // Unwrap params using use() hook or await in useEffect. 
    // Since we are in a client component and props are promises in Next.js 15, we can use `use` or useEffect.
    // The PO example used useEffect to unwrap params.

    const [salesOrderId, setSalesOrderId] = useState<string>('');
    const [salesOrder, setSalesOrder] = useState<SalesOrderWithItems | null>(null);
    const [isLoadingSO, setIsLoadingSO] = useState(true);

    const { updateSalesOrder } = useSalesOrders();
    const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
    const { data: branches, isLoading: branchesLoading } = useBranches();
    const { products, loading: productsLoading } = useProducts();

    useEffect(() => {
        params.then(({ id }) => {
            setSalesOrderId(id);
            fetchSalesOrder(id);
        });
    }, [params]);

    const fetchSalesOrder = async (id: string) => {
        try {
            setIsLoadingSO(true);
            const response = await fetch(`/api/sales-orders/${id}`);
            const data = await response.json();
            if (data.success) {
                setSalesOrder(data.data);
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to fetch sales order details',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to fetch sales order:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch sales order details',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingSO(false);
        }
    };

    const handleSubmit = async (data: any) => {
        // data matches UpdateSalesOrderInput conceptually
        // useSalesOrders update expects { id, data }
        const result = await updateSalesOrder({ id: salesOrderId, data });
        if (result?.success) {
            router.push('/sales-orders');
            return true;
        }
        return false;
    };

    const handleCancel = () => {
        router.push('/sales-orders');
    };

    if (isLoadingSO || warehousesLoading || branchesLoading || productsLoading) {
        return (
            <div className="p-6">
                <PageHeader
                    title="Edit Sales Order"
                    description="Update sales order details"
                />
                <TableSkeleton />
            </div>
        );
    }

    if (!salesOrder) {
        return (
            <div className="p-6">
                <PageHeader
                    title="Sales Order Not Found"
                    description="The requested sales order could not be found"
                />
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader
                title="Edit Sales Order"
                description={`Update sales order #${salesOrder.orderNumber}`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Sales Orders', href: '/sales-orders' },
                    { label: 'Edit' },
                ]}
            />

            <SalesOrderForm
                warehouses={warehouses || []}
                branches={branches || []}
                products={products || []}
                salesOrder={salesOrder}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </div>
    );
}
