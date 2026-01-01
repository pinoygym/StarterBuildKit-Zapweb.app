'use client';

import { use } from 'react';
import { useReceivingVoucherDetail, useCancelReceivingVoucher } from '@/hooks/use-receiving-vouchers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ArrowLeft, Printer, FileText, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatQuantity, formatPercentage } from '@/lib/utils';

export default function ReceivingVoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: rv, isLoading } = useReceivingVoucherDetail(id);
  const cancelMutation = useCancelReceivingVoucher();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const getVarianceBadge = (variance: number) => {
    if (variance === 0) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Exact Match</Badge>;
    } else if (variance < 0) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Under</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Over</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id,
        reason: cancelReason.trim(),
      });
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rv) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Receiving voucher not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{rv.rvNumber}</h1>
              <Badge
                variant={rv.status === 'cancelled' ? 'destructive' : 'default'}
                className={rv.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
              >
                {rv.status === 'cancelled' ? 'Cancelled' : 'Complete'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Received on {format(new Date(rv.receivedDate), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {rv.status === 'complete' && (
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <X className="h-4 w-4 mr-2" />
                  Cancel RV
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Receiving Voucher</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this receiving voucher? This will reverse all inventory changes and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <label className="text-sm font-medium">Cancellation Reason</label>
                  <Textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Please provide a reason for cancellation..."
                    className="mt-2"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    disabled={!cancelReason.trim() || cancelMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {cancelMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Receiving Voucher'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* RV Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Purchase Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PO Number:</span>
              <Link
                href={`/purchase-orders/${rv.purchaseOrderId}`}
                className="font-medium text-primary hover:underline"
              >
                {rv.PurchaseOrder.poNumber}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Supplier:</span>
              <span className="font-medium">{rv.PurchaseOrder.Supplier.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact:</span>
              <span className="font-medium">{rv.PurchaseOrder.Supplier.contactPerson}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receiving Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warehouse:</span>
              <span className="font-medium">{rv.Warehouse.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branch:</span>
              <span className="font-medium">{rv.Branch.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Received By:</span>
              <span className="font-medium">{rv.receiverName}</span>
            </div>
            {rv.deliveryNotes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notes:</span>
                <span className="font-medium">{rv.deliveryNotes}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items Received</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">UOM</TableHead>
                  <TableHead className="text-right">Ordered Qty</TableHead>
                  <TableHead className="text-right">Received Qty</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Variance %</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rv.ReceivingVoucherItem.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.Product.name}</TableCell>
                    <TableCell className="text-center font-medium">{item.uom}</TableCell>
                    <TableCell className="text-right">{formatQuantity(Number(item.orderedQuantity))}</TableCell>
                    <TableCell className="text-right">{formatQuantity(Number(item.receivedQuantity))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={Number(item.varianceQuantity) < 0 ? 'text-red-600' : Number(item.varianceQuantity) > 0 ? 'text-green-600' : ''}>
                          {formatQuantity(Number(item.varianceQuantity))}
                        </span>
                        {getVarianceBadge(Number(item.varianceQuantity))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={Number(item.variancePercentage) < 0 ? 'text-red-600' : Number(item.variancePercentage) > 0 ? 'text-green-600' : ''}>
                        {formatPercentage(Number(item.variancePercentage))}
                      </span>
                    </TableCell>
                    <TableCell>{item.varianceReason || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(item.unitPrice))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(item.lineTotal))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Ordered Amount:</span>
              <span className="font-medium">{formatCurrency(Number(rv.totalOrderedAmount))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Received Amount:</span>
              <span className="font-medium">{formatCurrency(Number(rv.totalReceivedAmount))}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Variance Amount:</span>
              <span className={Number(rv.varianceAmount) < 0 ? 'text-red-600' : Number(rv.varianceAmount) > 0 ? 'text-green-600' : ''}>
                {formatCurrency(Number(rv.varianceAmount))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items Fully Received:</span>
              <span className="font-medium">
                {rv.ReceivingVoucherItem.filter((i) => Number(i.varianceQuantity) === 0).length} / {rv.ReceivingVoucherItem.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
