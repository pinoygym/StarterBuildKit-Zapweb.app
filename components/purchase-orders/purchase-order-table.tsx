'use client';

import { useState } from 'react';
import { MoreHorizontal, Eye, Edit, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PurchaseOrderWithDetails } from '@/types/purchase-order.types';
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
import { ReceivingVoucherDialog } from '@/components/receiving-vouchers/receiving-voucher-dialog';

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrderWithDetails[];
  onEdit: (po: PurchaseOrderWithDetails) => void;
  onReceive?: (id: string) => Promise<any>; // Made optional, no longer used
  onCancel: (id: string, reason: string) => Promise<any>;
  onView: (po: PurchaseOrderWithDetails) => void;
}

export function PurchaseOrderTable({
  purchaseOrders,
  onEdit,
  onCancel,
  onView,
}: PurchaseOrderTableProps) {
  const [receivingVoucherDialogOpen, setReceivingVoucherDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderWithDetails | null>(null);
  const [cancelReason, setCancelReason] = useState('');

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

  const handleReceiveClick = (po: PurchaseOrderWithDetails) => {
    setSelectedPO(po);
    setReceivingVoucherDialogOpen(true);
  };

  const handleCancelClick = (po: PurchaseOrderWithDetails) => {
    setSelectedPO(po);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (selectedPO && cancelReason.trim()) {
      await onCancel(selectedPO.id, cancelReason);
      setCancelDialogOpen(false);
      setSelectedPO(null);
      setCancelReason('');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No purchase orders found
                </TableCell>
              </TableRow>
            ) : (
              purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.poNumber}</TableCell>
                  <TableCell>{po.Supplier.companyName}</TableCell>
                  <TableCell>{po.Warehouse.name}</TableCell>
                  <TableCell>{po.Branch.name}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(po.totalAmount))}
                  </TableCell>
                  <TableCell>{getStatusBadge(po.status)}</TableCell>
                  <TableCell>
                    {format(new Date(po.expectedDeliveryDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(po.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onView(po)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {(po.status === 'draft' || po.status === 'pending') && (
                          <DropdownMenuItem onClick={() => onEdit(po)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {po.status === 'ordered' && (
                          <DropdownMenuItem onClick={() => handleReceiveClick(po)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Receive
                          </DropdownMenuItem>
                        )}
                        {po.status !== 'received' && po.status !== 'cancelled' && (
                          <DropdownMenuItem
                            onClick={() => handleCancelClick(po)}
                            className="text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Receiving Voucher Dialog */}
      {selectedPO && (
        <ReceivingVoucherDialog
          open={receivingVoucherDialogOpen}
          onOpenChange={setReceivingVoucherDialogOpen}
          purchaseOrder={{
            id: selectedPO.id,
            poNumber: selectedPO.poNumber,
            items: selectedPO.PurchaseOrderItem.map((item) => ({
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
              Please provide a reason for cancelling PO {selectedPO?.poNumber}:
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
              onClick={handleCancelConfirm}
              disabled={!cancelReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Purchase Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
