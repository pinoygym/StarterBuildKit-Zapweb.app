'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { PurchaseOrderForm } from '@/components/purchase-orders/purchase-order-form';
import { usePurchaseOrders } from '@/hooks/use-purchase-orders';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useBranches } from '@/hooks/use-branches';
import { useProducts } from '@/hooks/use-products';
import { PurchaseOrderFormData } from '@/lib/validations/purchase-order.validation';
import { TableSkeleton } from '@/components/shared/loading-skeleton';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const { createPurchaseOrder } = usePurchaseOrders();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { warehouses, loading: warehousesLoading } = useWarehouses();
  const { branches, loading: branchesLoading } = useBranches();
  const { products, loading: productsLoading } = useProducts();

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    const result = await createPurchaseOrder(data);
    if (result.success) {
      router.push('/purchase-orders');
    }
  };

  const handleCancel = () => {
    router.push('/purchase-orders');
  };

  if (suppliersLoading || warehousesLoading || branchesLoading || productsLoading) {
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
      />
    </div>
  );
}
