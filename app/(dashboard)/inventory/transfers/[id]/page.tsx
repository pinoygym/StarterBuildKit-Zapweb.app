'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { TransferSlipForm, TransferFormData } from '@/components/inventory/transfer-slip-form';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useProducts } from '@/hooks/use-products';
import {
    useInventoryTransfer,
    useUpdateInventoryTransfer,
    usePostInventoryTransfer,
    useDeleteInventoryTransfer
} from '@/hooks/use-inventory-transfers';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ActionHeader } from '@/components/shared/action-header';
import { CheckCircle, ArrowLeft, Trash2, Loader2, Printer } from 'lucide-react';
import { ProductHistoryDialog } from '@/components/products/product-history-dialog';

export default function TransferDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const { data: transfer, isLoading: transferLoading } = useInventoryTransfer(id);
    const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
    const { products, loading: productsLoading } = useProducts();

    const { mutateAsync: updateTransfer } = useUpdateInventoryTransfer();
    const { mutateAsync: postTransfer, isPending: isPosting } = usePostInventoryTransfer();
    const { mutateAsync: deleteTransfer, isPending: isDeleting } = useDeleteInventoryTransfer();

    const [postDialogOpen, setPostDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedProductName, setSelectedProductName] = useState<string | null>(null);

    const handleProductClick = (productId: string, productName: string) => {
        setSelectedProductId(productId);
        setSelectedProductName(productName);
        setHistoryDialogOpen(true);
    };

    const handleSubmit = async (data: TransferFormData, isPost: boolean) => {
        try {
            await updateTransfer({ id, data });

            if (isPost) {
                await postTransfer(id);
            }

            router.push('/inventory/transfers');
            return true;
        } catch (error) {
            return false;
        }
    };

    const handleDelete = async () => {
        try {
            await deleteTransfer(id);
            router.push('/inventory/transfers');
        } catch (error) {
            // Handled by hook
        }
    };

    if (transferLoading || warehousesLoading || productsLoading) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => router.back()} className="pl-0 hover:pl-0 hover:bg-transparent">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </div>
                <TableSkeleton />
            </div>
        );
    }

    if (!transfer) {
        return <div className="p-6">Transfer not found</div>;
    }

    const isDraft = transfer.status === 'DRAFT';

    return (
        <div className="p-6">
            <PageHeader
                title={
                    <div className="flex items-center gap-3">
                        {isDraft ? 'Edit Transfer' : 'Transfer Details'}
                        <Badge variant={transfer.status === 'POSTED' ? 'default' : 'secondary'}>
                            {transfer.status}
                        </Badge>
                    </div>
                }
                description={`Reference: ${transfer.transferNumber}`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Inventory', href: '/inventory' },
                    { label: 'Transfers', href: '/inventory/transfers' },
                    { label: transfer.transferNumber },
                ]}
                actions={
                    <div className="flex gap-2">
                        {isDraft && (
                            <>
                                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Draft
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Draft Transfer?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete this draft transfer. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="default">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Post Transfer
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Post Transfer?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will deduct stock from {transfer.sourceWarehouse.name} and add it to {transfer.destinationWarehouse.name}. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleSubmit(transfer as any, true)} disabled={isPosting}>
                                                {isPosting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Posting...
                                                    </>
                                                ) : (
                                                    'Confirm Post'
                                                )}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                        {!isDraft && (
                            <Button variant="outline" onClick={() => window.print()}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Print Slip
                            </Button>
                        )}
                    </div>
                }
            />

            {isDraft ? (
                <TransferSlipForm
                    initialData={{
                        ...transfer,
                        transferDate: new Date(transfer.transferDate),
                        items: transfer.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            uom: item.uom
                        }))
                    } as any}
                    warehouses={warehouses || []}
                    products={products || []}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push('/inventory/transfers')}
                    isEdit={true}
                    status={transfer.status}
                />
            ) : (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transfer Info</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">From Warehouse</div>
                                <div>{transfer.sourceWarehouse.name}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">To Warehouse</div>
                                <div>{transfer.destinationWarehouse.name}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Date</div>
                                <div>{formatDate(transfer.transferDate)}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Reference</div>
                                <div>{transfer.referenceNumber || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Branch</div>
                                <div>{transfer.Branch.name}</div>
                            </div>
                            <div className="col-span-3">
                                <div className="text-sm font-medium text-muted-foreground">Reason</div>
                                <div>{transfer.reason || '-'}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-left">
                                        <tr>
                                            <th className="p-3 font-medium">Product</th>
                                            <th className="p-3 font-medium">Quantity</th>
                                            <th className="p-3 font-medium">UOM</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transfer.items.map((item) => (
                                            <tr key={item.id} className="border-t">
                                                <td className="p-3">
                                                    <button
                                                        onClick={() => handleProductClick(item.productId, item.Product.name)}
                                                        className="hover:underline text-primary text-left font-medium"
                                                    >
                                                        {item.Product.name}
                                                    </button>
                                                </td>
                                                <td className="p-3">{item.quantity}</td>
                                                <td className="p-3">{item.uom}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {selectedProductId && (
                <ProductHistoryDialog
                    open={historyDialogOpen}
                    onOpenChange={setHistoryDialogOpen}
                    productId={selectedProductId}
                    productName={selectedProductName || undefined}
                />
            )}
        </div>
    );
}
