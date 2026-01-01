'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { PurchaseOrderForm } from '@/components/purchase-orders/purchase-order-form';
import { usePurchaseOrders } from '@/hooks/use-purchase-orders';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useBranches } from '@/hooks/use-branches';
import { useProducts } from '@/hooks/use-products';
import { PurchaseOrderFormData } from '@/lib/validations/purchase-order.validation';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { PurchaseOrderWithDetails } from '@/types/purchase-order.types';

interface EditPurchaseOrderPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPurchaseOrderPage({ params }: EditPurchaseOrderPageProps) {
  const router = useRouter();
  const [purchaseOrderId, setPurchaseOrderId] = useState<string>('');
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderWithDetails | null>(null);
  const [isLoadingPO, setIsLoadingPO] = useState(true);

  const { updatePurchaseOrder } = usePurchaseOrders();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { warehouses, loading: warehousesLoading } = useWarehouses();
  const { branches, loading: branchesLoading } = useBranches();
  const { products, loading: productsLoading } = useProducts();

  useEffect(() => {
    params.then(({ id }) => {
      setPurchaseOrderId(id);
      fetchPurchaseOrder(id);
    });
  }, [params]);

  const fetchPurchaseOrder = async (id: string) => {
    try {
      setIsLoadingPO(true);
      const response = await fetch(`/api/purchase-orders/${id}`);
      const data = await response.json();
      if (data.success) {
        setPurchaseOrder(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch purchase order:', error);
    } finally {
      setIsLoadingPO(false);
    }
  };

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    const result = await updatePurchaseOrder(purchaseOrderId, data);
    if (result.success) {
      router.push('/purchase-orders');
    }
  };

  const handleCancel = () => {
    router.push('/purchase-orders');
  };

  if (isLoadingPO || suppliersLoading || warehousesLoading || branchesLoading || productsLoading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Edit Purchase Order"
          description="Update purchase order details"
        />
        <TableSkeleton />
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="p-6">
        <PageHeader
          title="Purchase Order Not Found"
          description="The requested purchase order could not be found"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Edit Purchase Order"
        description={`Update purchase order #${purchaseOrder.poNumber}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Purchase Orders', href: '/purchase-orders' },
          { label: 'Edit' },
        ]}
      />

      <PurchaseOrderForm
        suppliers={suppliers}
        warehouses={warehouses}
        branches={branches}
        products={products}
        purchaseOrder={purchaseOrder}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
