'use client';

import { useState } from 'react';
import { CreditCard, Banknote, FileText, Smartphone, Globe, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { CartItem } from '@/app/(dashboard)/pos/page';
import { PaymentMethod } from '@/types/pos.types';

interface POSPaymentProps {
  cart: CartItem[];
  branchId: string;
  warehouseId: string;
  convertedFromOrderId?: string;
  onComplete: (sale: any) => void;
  onCancel: () => void;
}

const paymentMethods: Array<{
  value: PaymentMethod;
  label: string;
  icon: any;
}> = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'check', label: 'Check', icon: FileText },
  { value: 'gcash', label: 'GCash', icon: Smartphone },
  { value: 'online_transfer', label: 'Online Transfer', icon: Globe },
];

export function POSPayment({
  cart,
  branchId,
  warehouseId,
  convertedFromOrderId,
  onComplete,
  onCancel,
}: POSPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.12; // 12% VAT
  const total = subtotal + tax;
  const change = selectedMethod === 'cash' && amountReceived
    ? parseFloat(amountReceived) - total
    : 0;

  const handleCompleteSale = async () => {
    // Validate cash payment
    if (selectedMethod === 'cash') {
      if (!amountReceived || parseFloat(amountReceived) < total) {
        toast({
          title: 'Invalid Amount',
          description: 'Amount received must be greater than or equal to total',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setProcessing(true);

      // Prepare sale data
      const saleData = {
        branchId,
        warehouseId,
        subtotal,
        tax,
        totalAmount: total,
        paymentMethod: selectedMethod,
        amountReceived: selectedMethod === 'cash' ? parseFloat(amountReceived) : undefined,
        change: selectedMethod === 'cash' ? change : undefined,
        convertedFromOrderId,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          uom: item.uom,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      };

      const response = await fetch('/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Sale Completed',
          description: 'Transaction processed successfully',
        });
        onComplete(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to process sale',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        title: 'Error',
        description: 'Failed to process sale',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Payment</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="space-y-2">
          <h3 className="font-semibold">Order Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (12%)</span>
              <span>₱{tax.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">₱{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label>Payment Method</Label>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <Button
                  key={method.value}
                  variant={selectedMethod === method.value ? 'default' : 'outline'}
                  className="h-auto py-3 flex flex-col items-center gap-2"
                  onClick={() => setSelectedMethod(method.value)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{method.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Cash Payment Fields */}
        {selectedMethod === 'cash' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amountReceived">Amount Received</Label>
              <Input
                id="amountReceived"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="text-lg"
              />
            </div>

            {amountReceived && parseFloat(amountReceived) >= total && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Change</span>
                  <span className="text-2xl font-bold text-primary">
                    ₱{change.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {amountReceived && parseFloat(amountReceived) < total && (
              <div className="text-sm text-destructive">
                Amount received is less than total
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleCompleteSale}
          disabled={processing || (selectedMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < total))}
          className="flex-1"
        >
          {processing ? 'Processing...' : 'Complete Sale'}
        </Button>
      </CardFooter>
    </Card>
  );
}
