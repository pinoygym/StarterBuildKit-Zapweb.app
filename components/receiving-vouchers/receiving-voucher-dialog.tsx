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
import { NumberInput } from '@/components/ui/number-input';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
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
  const [supplierDiscountType, setSupplierDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [supplierDiscount, setSupplierDiscount] = useState<number>(0);
  const [additionalFees, setAdditionalFees] = useState<number>(0);
  const [additionalFeesDescription, setAdditionalFeesDescription] = useState('');
  const [recomputeAverageCost, setRecomputeAverageCost] = useState(false);
  const [items, setItems] = useState(
    purchaseOrder.items.map((item) => ({
      poItemId: item.id,
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
        poItemId: item.poItemId,
        uom: item.uom,
        orderedQuantity: item.orderedQuantity,
        receivedQuantity: item.receivedQuantity,
        unitPrice: item.unitPrice,
        varianceReason: item.varianceReason.trim() || undefined,
      })),
      supplierDiscount: supplierDiscount > 0 ? supplierDiscount : undefined,
      supplierDiscountType: supplierDiscount > 0 ? supplierDiscountType : undefined,
      additionalFees: additionalFees > 0 ? additionalFees : undefined,
      additionalFeesDescription: additionalFeesDescription.trim() || undefined,
      recomputeAverageCost: recomputeAverageCost,
    };

    createReceivingVoucher.mutate(input, {
      onSuccess: () => {
        onOpenChange(false);
        setReceiverName('');
        setDeliveryNotes('');
        setSupplierDiscount(0);
        setAdditionalFees(0);
        setAdditionalFeesDescription('');
        setRecomputeAverageCost(false);
      },
    });
  };

  const totalOrdered = items.reduce((sum, item) => sum + item.orderedQuantity * item.unitPrice, 0);
  const totalReceived = items.reduce((sum, item) => sum + item.receivedQuantity * item.unitPrice, 0);
  const totalVariance = totalReceived - totalOrdered;

  // Calculate discount amount
  const discountAmount = supplierDiscountType === 'percentage'
    ? (totalReceived * supplierDiscount) / 100
    : supplierDiscount;

  // Calculate net amount
  const netAmount = totalReceived - discountAmount + additionalFees;

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
                        <NumberInput
                          step={0.01}
                          min={0}
                          placeholder="0"
                          decimalPlaces={2}
                          value={item.receivedQuantity}
                          onChange={(value) => handleReceivedQuantityChange(index, String(value || 0))}
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
                        <NumberInput
                          step={0.01}
                          min={0}
                          placeholder="0.00"
                          decimalPlaces={2}
                          value={item.unitPrice}
                          onChange={(value) => handleUnitPriceChange(index, String(value || 0))}
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

          {/* Supplier Discount */}
          <div className="rounded-lg border p-4 space-y-3">
            <Label className="text-base font-semibold">Supplier Discount</Label>
            <RadioGroup
              value={supplierDiscountType}
              onValueChange={(value: string) => setSupplierDiscountType(value as 'percentage' | 'fixed')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="font-normal cursor-pointer">Percentage (%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer">Fixed Amount (₱)</Label>
              </div>
            </RadioGroup>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <NumberInput
                  step={0.01}
                  min={0}
                  max={supplierDiscountType === 'percentage' ? 100 : undefined}
                  placeholder={supplierDiscountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                  decimalPlaces={2}
                  value={supplierDiscount}
                  onChange={(value) => setSupplierDiscount(value || 0)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Discount: <span className="font-semibold text-foreground">₱{discountAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Additional Fees */}
          <div className="rounded-lg border p-4 space-y-3">
            <Label className="text-base font-semibold">Additional Fees</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="additionalFees">Amount (₱)</Label>
                <NumberInput
                  id="additionalFees"
                  step={0.01}
                  min={0}
                  placeholder="Enter additional fees"
                  decimalPlaces={2}
                  value={additionalFees}
                  onChange={(value) => setAdditionalFees(value || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feesDescription">Description (Optional)</Label>
                <Input
                  id="feesDescription"
                  value={additionalFeesDescription}
                  onChange={(e) => setAdditionalFeesDescription(e.target.value)}
                  placeholder="e.g., Delivery charge, Handling fee"
                />
              </div>
            </div>
          </div>

          {/* Recompute Average Cost */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recomputeAverageCost"
                checked={recomputeAverageCost}
                onCheckedChange={(checked) => setRecomputeAverageCost(checked as boolean)}
              />
              <Label htmlFor="recomputeAverageCost" className="text-base font-semibold cursor-pointer">
                Recompute Unit Average Cost
              </Label>
            </div>
            {recomputeAverageCost && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will adjust the inventory unit costs based on the net amount after discount and fees.
                  The discount and fees will be distributed proportionally across all items.
                </AlertDescription>
              </Alert>
            )}
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
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Supplier Discount:</span>
                <span className="font-medium">-₱{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {additionalFees > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>Additional Fees:</span>
                <span className="font-medium">+₱{additionalFees.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Net Amount:</span>
              <span className="text-green-600">₱{netAmount.toFixed(2)}</span>
            </div>
            {totalVariance !== 0 && (
              <div className="flex justify-between text-sm pt-2 border-t">
                <span>Variance:</span>
                <span className={totalVariance < 0 ? 'text-red-600' : 'text-green-600'}>
                  ₱{totalVariance.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createReceivingVoucher.isPending}
            className="active:scale-95 transition-transform"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createReceivingVoucher.isPending}
            className="active:scale-95 transition-transform"
          >
            {createReceivingVoucher.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Receiving Voucher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
