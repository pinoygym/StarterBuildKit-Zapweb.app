'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, Edit, XCircle } from 'lucide-react';
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

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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
    try {
      const response = await fetch(`/api/purchase-orders/${id}/receive`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Purchase order received successfully',
        });
        setReceiveDialogOpen(false);
        await fetchPurchaseOrder();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to receive purchase order',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to receive purchase order',
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
            {(purchaseOrder.status === 'draft' || purchaseOrder.status === 'pending') && (
              <Button
                variant="outline"
                onClick={() => router.push(`/purchase-orders/${id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {purchaseOrder.status === 'ordered' && (
              <Button onClick={() => setReceiveDialogOpen(true)}>
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
                <div className="font-medium">{purchaseOrder.supplier.companyName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Warehouse</div>
                <div className="font-medium">{purchaseOrder.warehouse.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Branch</div>
                <div className="font-medium">{purchaseOrder.branch.name}</div>
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
                {purchaseOrder.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell className="text-right">
                      {Number(item.quantity)} {item.product.baseUOM}
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

      {/* Receive Confirmation Dialog */}
      <AlertDialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Receive Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to receive PO {purchaseOrder.poNumber}? This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Create inventory batches for all items</li>
                <li>Update stock levels in {purchaseOrder.warehouse.name}</li>
                <li>Create an Accounts Payable record</li>
                <li>Mark the PO as received</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReceive}>
              Receive Purchase Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </div>
  );
}
