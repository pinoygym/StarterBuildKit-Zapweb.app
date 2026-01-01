'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { AdjustmentForm, AdjustmentFormData } from '@/components/inventory/adjustment-form';
import { AdjustmentSlipPrint } from '@/components/inventory/adjustment-slip-print';
import { AdjustmentSlip } from '@/types/inventory.types';
import { useWarehouses } from '@/hooks/use-warehouses';
import { useBranches } from '@/hooks/use-branches';
import { useProducts } from '@/hooks/use-products';
import {
    useInventoryAdjustment,
    useUpdateInventoryAdjustment,
    usePostInventoryAdjustment,
    useCopyInventoryAdjustment,
    useReverseInventoryAdjustment
} from '@/hooks/use-inventory-adjustments';
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
import { Copy, RotateCcw, CheckCircle, ArrowLeft, Printer, Loader2 } from 'lucide-react';

export default function AdjustmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const { data: adjustment, isLoading: adjustmentLoading } = useInventoryAdjustment(id);
    const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
    const { data: branches, isLoading: branchesLoading } = useBranches();
    const { products, loading: productsLoading } = useProducts();

    const { mutateAsync: updateAdjustment, isPending: isUpdating } = useUpdateInventoryAdjustment();
    const { mutateAsync: postAdjustment, isPending: isPosting } = usePostInventoryAdjustment();
    const { mutateAsync: copyAdjustment, isPending: isCopying } = useCopyInventoryAdjustment();
    const { mutateAsync: reverseAdjustment, isPending: isReversing } = useReverseInventoryAdjustment();

    const [postDialogOpen, setPostDialogOpen] = useState(false);
    const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);

    const getAdjustmentSlip = (): AdjustmentSlip | null => {
        if (!adjustment) return null;

        return {
            referenceId: adjustment.id,
            referenceNumber: adjustment.referenceNumber || adjustment.adjustmentNumber, // Fallback to adjustment number if reference is empty
            warehouseId: adjustment.warehouseId,
            warehouseName: adjustment.Warehouse.name,
            reason: adjustment.reason,
            adjustmentDate: new Date(adjustment.adjustmentDate),
            totalItems: adjustment.items.length,
            createdAt: new Date(adjustment.createdAt),
            items: adjustment.items.map(item => ({
                id: item.id,
                productId: item.productId,
                productName: item.Product.name,
                quantity: item.quantity,
                baseUOM: item.uom, // Use the stored UOM
                warehouseId: adjustment.warehouseId,
                warehouseName: adjustment.Warehouse.name,
                createdAt: new Date(adjustment.createdAt) // Using parent creation date as item date isn't strictly tracked separate here
            }))
        };
    };

    const handleUpdate = async (data: AdjustmentFormData) => {
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
            await updateAdjustment({ id, data: formattedData });
            // Stay on page or show success
        } catch (error) {
            // Handled by hook
        }
    };

    const handlePost = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await postAdjustment(id);
            setPostDialogOpen(false);
        } catch (error) {
            // Handled by hook
        }
    };

    const handleCopy = async () => {
        try {
            await copyAdjustment(id);
            router.push('/inventory/adjustments'); // Or redirect to new draft if hook returned ID
        } catch (error) {
            // Handled by hook
        }
    };

    const handleReverse = async () => {
        try {
            await reverseAdjustment(id);
            setReverseDialogOpen(false);
            router.push('/inventory/adjustments');
        } catch (error) {
            // Handled by hook
        }
    };

    if (adjustmentLoading || warehousesLoading || branchesLoading || productsLoading) {
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

    if (!adjustment) {
        return <div className="p-6">Adjustment not found</div>;
    }

    const isDraft = adjustment.status === 'DRAFT';

    return (
        <div className="p-6">
            <PageHeader
                title={
                    <div className="flex items-center gap-3">
                        {isDraft ? 'Edit Adjustment' : 'Adjustment Details'}
                        <Badge variant={adjustment.status === 'POSTED' ? 'default' : 'secondary'}>
                            {adjustment.status}
                        </Badge>
                    </div>
                }
                description={`Reference: ${adjustment.adjustmentNumber}`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Inventory', href: '/inventory' },
                    { label: 'Adjustments', href: '/inventory/adjustments' },
                    { label: adjustment.adjustmentNumber },
                ]}
                actions={
                    <div className="flex gap-2">
                        {isDraft && (
                            <AlertDialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="default">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Post Adjustment
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Post Adjustment?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will update inventory levels and create stock movements. This action cannot be undone directly (requires reversal).
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={(e) => handlePost(e)} disabled={isPosting}>
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
                        )}
                        <Button variant="outline" onClick={() => setPrintDialogOpen(true)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print Slip
                        </Button>
                        {!isDraft && (
                            <>
                                <Button variant="outline" onClick={handleCopy} disabled={isCopying}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy
                                </Button>
                                {adjustment.status === 'POSTED' && (
                                    <AlertDialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen}>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive">
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Reverse
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Reverse Adjustment?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will create a NEW adjustment with opposite quantities to reverse the effect of this adjustment.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleReverse} disabled={isReversing} className="bg-destructive hover:bg-destructive/90">
                                                    {isReversing ? 'Reversing...' : 'Confirm Reverse'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </>
                        )}
                    </div>
                }
            />

            {isDraft ? (
                <AdjustmentForm
                    initialData={adjustment}
                    warehouses={warehouses || []}
                    branches={branches || []}
                    products={products || []}
                    onSubmit={handleUpdate}
                    onCancel={() => router.push('/inventory/adjustments')}
                    isSubmitting={isUpdating}
                />
            ) : (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Adjustment Info</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Warehouse</div>
                                <div>{adjustment.Warehouse.name}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Branch</div>
                                <div>{adjustment.Branch.name}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Date</div>
                                <div>{formatDate(adjustment.adjustmentDate)}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Reference</div>
                                <div>{adjustment.referenceNumber || '-'}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-sm font-medium text-muted-foreground">Reason</div>
                                <div>{adjustment.reason}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-left">
                                        <tr>
                                            <th className="p-3 font-medium">Product</th>
                                            <th className="p-3 font-medium">Type</th>
                                            <th className="p-3 font-medium">Quantity</th>
                                            <th className="p-3 font-medium">UOM</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adjustment.items.map((item) => (
                                            <tr key={item.id} className="border-t">
                                                <td className="p-3">{item.Product.name}</td>
                                                <td className="p-3"><Badge variant="outline">{item.type}</Badge></td>
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

            {adjustment && getAdjustmentSlip() && (
                <AdjustmentSlipPrint
                    adjustment={getAdjustmentSlip()!}
                    open={printDialogOpen}
                    onClose={() => setPrintDialogOpen(false)}
                />
            )}
        </div>
    );
}
