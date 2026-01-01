'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useCreateReceivingVoucher } from '@/hooks/use-receiving-vouchers';
import { CreateReceivingVoucherInput } from '@/types/receiving-voucher.types';

interface ReceivingVoucherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: {
    id: string;
    poNumber: string;
    items: Array<{
      id: string;
      productId: string;
      product: { name: string; baseUOM: string };
      uom: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
}

export function ReceivingVoucherDialog({
  open,
  onOpenChange,
  purchaseOrder,
}: ReceivingVoucherDialogProps) {
  const [receiverName, setReceiverName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [items, setItems] = useState(
    purchaseOrder.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      uom: item.uom,
      orderedQuantity: Number(item.quantity),
      receivedQuantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      varianceReason: '',
    }))
  );

  const createReceivingVoucher = useCreateReceivingVoucher();

  const handleReceivedQuantityChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].receivedQuantity = parseFloat(value) || 0;
    setItems(newItems);
  };

  const handleVarianceReasonChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].varianceReason = value;
    setItems(newItems);
  };

  const handleUnitPriceChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].unitPrice = parseFloat(value) || 0;
    setItems(newItems);
  };

  const calculateVariance = (ordered: number, received: number) => {
    return received - ordered;
  };

  const calculateVariancePercentage = (ordered: number, received: number) => {
    if (ordered === 0) return 0;
    return ((received - ordered) / ordered) * 100;
  };

  const getVarianceBadge = (variance: number) => {
    if (variance === 0) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Match</Badge>;
    } else if (variance < 0) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Under</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Over</Badge>;
    }
  };

  const handleSubmit = () => {
    if (!receiverName.trim()) {
      alert('Please enter receiver name');
      return;
    }

    const input: CreateReceivingVoucherInput = {
      purchaseOrderId: purchaseOrder.id,
      receiverName: receiverName.trim(),
      deliveryNotes: deliveryNotes.trim() || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        uom: item.uom,
        orderedQuantity: item.orderedQuantity,
        receivedQuantity: item.receivedQuantity,
        unitPrice: item.unitPrice,
        varianceReason: item.varianceReason.trim() || undefined,
      })),
    };

    createReceivingVoucher.mutate(input, {
      onSuccess: () => {
        onOpenChange(false);
        setReceiverName('');
        setDeliveryNotes('');
      },
    });
  };

  const totalOrdered = items.reduce((sum, item) => sum + item.orderedQuantity * item.unitPrice, 0);
  const totalReceived = items.reduce((sum, item) => sum + item.receivedQuantity * item.unitPrice, 0);
  const totalVariance = totalReceived - totalOrdered;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Receiving Voucher</DialogTitle>
          <DialogDescription>
            Record actual received quantities for PO {purchaseOrder.poNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receiver Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="receiverName">Receiver Name *</Label>
              <Input
                id="receiverName"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Enter receiver name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryNotes">Delivery Notes</Label>
              <Input
                id="deliveryNotes"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Received *</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const variance = calculateVariance(item.orderedQuantity, item.receivedQuantity);
                  const variancePercentage = calculateVariancePercentage(
                    item.orderedQuantity,
                    item.receivedQuantity
                  );
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-right">
                        {item.orderedQuantity} {item.uom}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.receivedQuantity}
                          onChange={(e) => handleReceivedQuantityChange(index, e.target.value)}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={variance < 0 ? 'text-red-600' : variance > 0 ? 'text-green-600' : ''}>
                            {variance.toFixed(2)} ({variancePercentage.toFixed(1)}%)
                          </span>
                          {getVarianceBadge(variance)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {variance !== 0 && (
                          <Input
                            placeholder="Reason"
                            value={item.varianceReason}
                            onChange={(e) => handleVarianceReasonChange(index, e.target.value)}
                            className="w-40"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                          className="w-28 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{(item.receivedQuantity * item.unitPrice).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Ordered Amount:</span>
              <span className="font-medium">₱{totalOrdered.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Received Amount:</span>
              <span className="font-medium">₱{totalReceived.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Variance:</span>
              <span className={totalVariance < 0 ? 'text-red-600' : totalVariance > 0 ? 'text-green-600' : ''}>
                ₱{totalVariance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createReceivingVoucher.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createReceivingVoucher.isPending}>
            {createReceivingVoucher.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Receiving Voucher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
