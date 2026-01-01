'use client';

import { useState } from 'react';
import { CreditCard, Banknote, FileText, Smartphone, Globe, ArrowLeft, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { CartItem } from '@/app/(dashboard)/pos/page';
import { PaymentMethod } from '@/types/pos.types';
import { CustomerSelector } from './customer-selector';
import { CustomerWithRelations } from '@/types/customer.types';

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
  { value: 'credit', label: 'Credit (AR)', icon: UserIcon },
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
  const [partialPayment, setPartialPayment] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithRelations | null>(null);
  const [processing, setProcessing] = useState(false);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.12; // 12% VAT
  const total = subtotal + tax;
  const change = selectedMethod === 'cash' && amountReceived
    ? parseFloat(amountReceived) - total
    : 0;

  const handleCompleteSale = async () => {
    // Validate credit sale requires customer
    if (selectedMethod === 'credit') {
      if (!selectedCustomer) {
        toast({
          title: 'Customer Required',
          description: 'Please select a customer for credit sales',
          variant: 'destructive',
        });
        return;
      }

      // Check credit limit if applicable
      if (selectedCustomer.creditLimit) {
        const creditLimit = Number(selectedCustomer.creditLimit);
        const partialPmt = partialPayment ? parseFloat(partialPayment) : 0;
        const outstandingAmount = total - partialPmt;
        
        if (outstandingAmount > creditLimit) {
          toast({
            title: 'Credit Limit Exceeded',
            description: `Customer credit limit is ₱${creditLimit.toFixed(2)}. Outstanding amount would be ₱${outstandingAmount.toFixed(2)}`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Validate partial payment if provided
      if (partialPayment) {
        const partialPmt = parseFloat(partialPayment);
        if (isNaN(partialPmt) || partialPmt < 0) {
          toast({
            title: 'Invalid Partial Payment',
            description: 'Partial payment must be a valid positive number',
            variant: 'destructive',
          });
          return;
        }
        if (partialPmt >= total) {
          toast({
            title: 'Invalid Partial Payment',
            description: 'Partial payment must be less than total amount. For full payment, use another payment method.',
            variant: 'destructive',
          });
          return;
        }
      }
    }

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
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer ? (selectedCustomer.companyName || selectedCustomer.contactPerson) : undefined,
        subtotal,
        tax,
        totalAmount: total,
        paymentMethod: selectedMethod,
        amountReceived: selectedMethod === 'cash' ? parseFloat(amountReceived) : undefined,
        partialPayment: selectedMethod === 'credit' && partialPayment ? parseFloat(partialPayment) : undefined,
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

      console.log('Sending POS sale data:', saleData);

      const response = await fetch('/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      console.log('POS sale response status:', response.status);

      const data = await response.json();

      console.log('POS sale response data:', data);

      if (data.success) {
        toast({
          title: 'Sale Completed',
          description: 'Transaction processed successfully',
        });
        onComplete(data.data);
      } else {
        console.error('POS sale failed:', data);

        // Show detailed error if validation errors exist
        let errorMessage = data.error || 'Failed to process sale';
        if (data.fields) {
          const fieldErrors = Object.entries(data.fields)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = `${errorMessage} - ${fieldErrors}`;
        }

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process sale',
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
        {/* Customer Selection */}
        <CustomerSelector
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
        />

        <Separator />

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

        {/* Credit Payment Fields */}
        {selectedMethod === 'credit' && (
          <div className="space-y-4">
            {!selectedCustomer && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                Please select a customer to process a credit sale
              </div>
            )}

            {selectedCustomer && selectedCustomer.paymentTerms && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-1">
                <div className="text-sm font-medium text-blue-900">
                  Payment Terms: {selectedCustomer.paymentTerms}
                </div>
                {selectedCustomer.creditLimit && (
                  <div className="text-xs text-blue-700">
                    Credit Limit: ₱{Number(selectedCustomer.creditLimit).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="partialPayment">Partial Payment (Optional)</Label>
              <Input
                id="partialPayment"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={partialPayment}
                onChange={(e) => setPartialPayment(e.target.value)}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for full credit. Enter amount to make partial payment.
              </p>
            </div>

            {partialPayment && parseFloat(partialPayment) > 0 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Partial Payment</span>
                  <span className="font-medium">₱{parseFloat(partialPayment).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Balance to AR</span>
                  <span className="text-lg font-bold text-primary">
                    ₱{(total - parseFloat(partialPayment)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {!partialPayment && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Full Amount to AR</span>
                  <span className="text-lg font-bold text-primary">₱{total.toFixed(2)}</span>
                </div>
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
          disabled={processing || (selectedMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < total)) || (selectedMethod === 'credit' && !selectedCustomer)}
          className="flex-1"
        >
          {processing ? 'Processing...' : 'Complete Sale'}
        </Button>
      </CardFooter>
    </Card>
  );
}
