'use client';

import { format } from 'date-fns';
import { X, Printer, User, Calendar, CreditCard, Package, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { POSSaleWithItems } from '@/types/pos.types';

interface SaleDetailModalProps {
  sale: POSSaleWithItems | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailModal({ sale, open, onOpenChange }: SaleDetailModalProps) {
  if (!sale) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants: { [key: string]: any } = {
      cash: 'default',
      credit: 'secondary',
      ar_credit: 'outline',
    };
    const labels: { [key: string]: string } = {
      cash: 'Cash',
      credit: 'Credit',
      ar_credit: 'AR Credit',
    };
    return <Badge variant={variants[method] || 'default'}>{labels[method] || method}</Badge>;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Sale Details</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Receipt Header */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">{sale.Branch?.name || 'Store Name'}</h3>
            <p className="text-sm text-muted-foreground">Receipt #{sale.receiptNumber}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(sale.createdAt), 'MMMM dd, yyyy hh:mm a')}
            </p>
          </div>

          <Separator />

          {/* Transaction Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Customer</span>
              </div>
              <p className="font-medium">
                {sale.customerName || 'Walk-in Customer'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Cashier</span>
              </div>
              <p className="font-medium">
                {sale.User ? `${sale.User.firstName} ${sale.User.lastName}` : 'N/A'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Date & Time</span>
              </div>
              <p className="font-medium">
                {format(new Date(sale.createdAt), 'MMM dd, yyyy hh:mm a')}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span>Payment Method</span>
              </div>
              <div>{getPaymentMethodBadge(sale.paymentMethod)}</div>
            </div>
          </div>

          <Separator />

          {/* Items Table */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold">Items Purchased</h4>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Product</th>
                    <th className="text-center p-3 text-sm font-medium">Qty</th>
                    <th className="text-right p-3 text-sm font-medium">Price</th>
                    <th className="text-right p-3 text-sm font-medium">Discount</th>
                    <th className="text-right p-3 text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sale.POSSaleItem.map((item, index) => (
                    <tr key={index}>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{item.Product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} {item.uom}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {Number(item.quantity)}
                      </td>
                      <td className="p-3 text-right">
                        {item.originalPrice && item.discount > 0 ? (
                          <div>
                            <div className="text-xs line-through text-muted-foreground">
                              {formatCurrency(Number(item.originalPrice))}
                            </div>
                            <div>{formatCurrency(Number(item.unitPrice))}</div>
                          </div>
                        ) : (
                          <div>{formatCurrency(Number(item.unitPrice))}</div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {item.discount > 0 ? (
                          <div className="text-green-600">
                            -{formatCurrency(Number(item.discount))}
                            {item.discountType === 'percentage' && item.discountValue && (
                              <div className="text-xs text-muted-foreground">
                                ({item.discountValue}%)
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(Number(item.subtotal))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold">Payment Summary</h4>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(sale.subtotal))}</span>
              </div>

              {sale.discount && Number(sale.discount) > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount
                      {sale.discountType === 'percentage' && sale.discountValue &&
                        ` (${sale.discountValue}%)`
                      }
                    </span>
                    <span className="text-green-600 font-medium">
                      -{formatCurrency(Number(sale.discount))}
                    </span>
                  </div>
                  {sale.discountReason && (
                    <p className="text-xs text-muted-foreground italic">
                      Reason: {sale.discountReason}
                    </p>
                  )}
                </div>
              )}

              {sale.tax && Number(sale.tax) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT</span>
                  <span>{formatCurrency(Number(sale.tax))}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span>{formatCurrency(Number(sale.totalAmount))}</span>
              </div>

              {sale.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount Received</span>
                    <span>{formatCurrency(Number(sale.amountReceived || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Change</span>
                    <span className="text-green-600">
                      {formatCurrency(Number(sale.change || 0))}
                    </span>
                  </div>
                </>
              )}

              {sale.paymentMethod === 'credit' && sale.partialPayment && Number(sale.partialPayment) > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Partial Payment</span>
                    <span>{formatCurrency(Number(sale.partialPayment))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Outstanding Balance</span>
                    <span className="text-orange-600">
                      {formatCurrency(Number(sale.totalAmount) - Number(sale.partialPayment))}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {sale.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{sale.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
