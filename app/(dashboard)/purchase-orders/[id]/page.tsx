'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, Edit, XCircle, Send, Printer } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PurchaseOrderWithDetails } from '@/types/purchase-order.types';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { toast } from '@/hooks/use-toast';
import { ReceivingVoucherDialog } from '@/components/receiving-vouchers/receiving-voucher-dialog';
import { PurchaseOrderPrint } from '@/components/purchase-orders/purchase-order-print';

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [receivingVoucherDialogOpen, setReceivingVoucherDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  useEffect(() => {
    fetchPurchaseOrder();
  }, [id]);

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/purchase-orders/${id}`);
      const data = await response.json();

      if (data.success) {
        setPurchaseOrder(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch purchase order',
          variant: 'destructive',
        });
        router.push('/purchase-orders');
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch purchase order',
        variant: 'destructive',
      });
      router.push('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    // Open receiving voucher dialog instead of direct receive
    setReceivingVoucherDialogOpen(true);
  };

  const handleSubmitOrder = async () => {
    try {
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ordered' }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Purchase order submitted successfully',
        });
        setSubmitDialogOpen(false);
        await fetchPurchaseOrder();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit purchase order',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit purchase order',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;

    try {
      const response = await fetch(`/api/purchase-orders/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Purchase order cancelled successfully',
        });
        setCancelDialogOpen(false);
        setCancelReason('');
        await fetchPurchaseOrder();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to cancel purchase order',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel purchase order',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      pending: 'secondary',
      ordered: 'default',
      received: 'default',
      cancelled: 'destructive',
    };

    const colors: Record<string, string> = {
      draft: 'text-gray-600',
      pending: 'text-yellow-600',
      ordered: 'text-blue-600',
      received: 'text-green-600',
      cancelled: 'text-red-600',
    };

    return (
      <Badge variant={variants[status] || 'default'} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Purchase Order Details" description="Loading..." />
        <TableSkeleton />
      </div>
    );
  }

  if (!purchaseOrder) {
    return null;
  }

  return (
    <div className="p-6">
      <PageHeader
        title={`Purchase Order ${purchaseOrder.poNumber}`}
        description="View purchase order details and manage status"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Purchase Orders', href: '/purchase-orders' },
          { label: purchaseOrder.poNumber },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/purchase-orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={() => setPrintDialogOpen(true)}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            {(purchaseOrder.status === 'draft' || purchaseOrder.status === 'pending') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/purchase-orders/${id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={() => setSubmitDialogOpen(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Order
                </Button>
              </>
            )}
            {purchaseOrder.status === 'ordered' && (
              <Button onClick={handleReceive}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Receive
              </Button>
            )}
            {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled' && (
              <Button
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {/* PO Information */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">PO Number</div>
                <div className="font-medium">{purchaseOrder.poNumber}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div>{getStatusBadge(purchaseOrder.status)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Supplier</div>
                <div className="font-medium">{purchaseOrder.Supplier.companyName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Warehouse</div>
                <div className="font-medium">{purchaseOrder.Warehouse.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Branch</div>
                <div className="font-medium">{purchaseOrder.Branch.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expected Delivery</div>
                <div className="font-medium">
                  {format(new Date(purchaseOrder.expectedDeliveryDate), 'MMM dd, yyyy')}
                </div>
              </div>
              {purchaseOrder.actualDeliveryDate && (
                <div>
                  <div className="text-sm text-muted-foreground">Actual Delivery</div>
                  <div className="font-medium">
                    {format(new Date(purchaseOrder.actualDeliveryDate), 'MMM dd, yyyy')}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">
                  {format(new Date(purchaseOrder.createdAt), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
            {purchaseOrder.notes && (
              <div className="mt-4">
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="mt-1 text-sm">{purchaseOrder.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.PurchaseOrderItem.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.Product.name}</TableCell>
                    <TableCell className="text-right">
                      {Number(item.quantity)} {item.Product.baseUOM}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(item.unitPrice))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(item.subtotal))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total Amount
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(Number(purchaseOrder.totalAmount))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Submit Order Dialog */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Purchase Order</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to submit PO {purchaseOrder.poNumber}? This will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Change status to &quot;Ordered&quot;</li>
                  <li>Lock the PO from further editing</li>
                  <li>Ready the PO for receiving</li>
                </ul>
                You can still cancel the order if needed.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitOrder}>
              Submit Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receiving Voucher Dialog */}
      {purchaseOrder && (
        <ReceivingVoucherDialog
          open={receivingVoucherDialogOpen}
          onOpenChange={(open) => {
            setReceivingVoucherDialogOpen(open);
            if (!open) {
              // Refresh PO data after closing dialog
              fetchPurchaseOrder();
            }
          }}
          purchaseOrder={{
            id: purchaseOrder.id,
            poNumber: purchaseOrder.poNumber,
            items: purchaseOrder.PurchaseOrderItem.map((item) => ({
              id: item.id,
              productId: item.productId,
              product: {
                name: item.Product.name,
                baseUOM: item.Product.baseUOM,
              },
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
            })),
          }}
        />
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for cancelling PO {purchaseOrder.poNumber}:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancelReason">Cancellation Reason</Label>
            <Input
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason for cancellation"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={!cancelReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Purchase Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purchase Order Print Dialog */}
      {purchaseOrder && (
        <PurchaseOrderPrint
          purchaseOrder={purchaseOrder}
          open={printDialogOpen}
          onClose={() => setPrintDialogOpen(false)}
        />
      )}
    </div>
  );
}
