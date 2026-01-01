'use client';

import { useSearchParams, useRouter } from 'next/navigation';
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
import { toast } from '@/hooks/use-toast';

// Prevent static generation at build time
export const dynamic = 'force-dynamic';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFromId = searchParams.get('copyFrom');

  const { createPurchaseOrder } = usePurchaseOrders();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { warehouses, loading: warehousesLoading } = useWarehouses();
  const { branches, loading: branchesLoading } = useBranches();
  const { products, loading: productsLoading } = useProducts();

  const [sourcePO, setSourcePO] = useState<PurchaseOrderWithDetails | null>(null);
  const [loadingSourcePO, setLoadingSourcePO] = useState(false);

  useEffect(() => {
    const fetchSourcePO = async () => {
      if (!copyFromId) return;

      try {
        setLoadingSourcePO(true);
        const response = await fetch(`/api/purchase-orders/${copyFromId}`);
        const data = await response.json();

        if (data.success) {
          setSourcePO(data.data);
          toast({
            title: 'Info',
            description: 'Loaded details from existing purchase order',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load source purchase order',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching source PO:', error);
        toast({
          title: 'Error',
          description: 'Failed to load source purchase order',
          variant: 'destructive',
        });
      } finally {
        setLoadingSourcePO(false);
      }
    };

    fetchSourcePO();
  }, [copyFromId]);

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    const result = await createPurchaseOrder(data);
    if (result.success) {
      router.push('/purchase-orders');
    }
  };

  const handleCancel = () => {
    router.push('/purchase-orders');
  };

  if (suppliersLoading || warehousesLoading || branchesLoading || productsLoading || loadingSourcePO) {
    return (
      <div className="p-6">
        <PageHeader
          title="Create Purchase Order"
          description="Create a new purchase order"
        />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Create Purchase Order"
        description="Create a new purchase order for supplier procurement"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Purchase Orders', href: '/purchase-orders' },
          { label: 'New' },
        ]}
      />

      <PurchaseOrderForm
        suppliers={suppliers}
        warehouses={warehouses}
        branches={branches}
        products={products}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        purchaseOrder={sourcePO}
        isCopy={!!sourcePO}
      />
    </div>
  );
}
