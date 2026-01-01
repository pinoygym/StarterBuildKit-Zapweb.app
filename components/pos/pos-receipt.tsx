'use client';

import { Printer, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { POSSaleWithItems } from '@/types/pos.types';

interface POSReceiptProps {
  sale: POSSaleWithItems;
  open: boolean;
  onClose: () => void;
}

export function POSReceipt({ sale, open, onClose }: POSReceiptProps) {
  const handlePrint = () => {
    // Create a print-specific window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback to regular print if popup blocked
      window.print();
      return;
    }

    const receiptContent = document.getElementById('receipt-content');
    if (!receiptContent) return;

    // Write the receipt content to the new window with print styles
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${sale.receiptNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 16px;
            }
            .receipt-header h2 {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .receipt-header p {
              font-size: 10px;
              color: #666;
            }
            .separator {
              border-top: 1px dashed #000;
              margin: 12px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              font-size: 11px;
            }
            .info-label {
              color: #666;
            }
            .info-value {
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 12px 0;
            }
            th {
              text-align: left;
              padding: 4px 0;
              border-bottom: 1px solid #000;
              font-size: 10px;
            }
            th.center {
              text-align: center;
            }
            th.right {
              text-align: right;
            }
            td {
              padding: 6px 0;
              border-bottom: 1px dashed #ccc;
              font-size: 11px;
            }
            td.center {
              text-align: center;
            }
            td.right {
              text-align: right;
            }
            .item-name {
              font-weight: bold;
            }
            .item-uom {
              font-size: 9px;
              color: #666;
            }
            .totals {
              margin-top: 12px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              font-size: 11px;
            }
            .total-row.grand {
              font-size: 14px;
              font-weight: bold;
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px solid #000;
            }
            .footer {
              text-align: center;
              margin-top: 16px;
              font-size: 10px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${receiptContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>

        {/* Receipt Content */}
        <div id="receipt-content" className="space-y-4 p-4 bg-white text-black">
          {/* Header */}
          <div className="receipt-header text-center space-y-1">
            <h2 className="text-xl font-bold">InventoryPro</h2>
            <p className="text-sm text-muted-foreground">Soft Drinks Wholesale</p>
            <p className="text-xs text-muted-foreground">
              {sale.branch?.name || 'Main Branch'}
            </p>
            <p className="text-xs text-muted-foreground">
              {sale.branch?.location || ''}
            </p>
          </div>

          <div className="separator">
            <Separator />
          </div>

          {/* Receipt Info */}
          <div className="space-y-1 text-sm">
            <div className="info-row flex justify-between">
              <span className="info-label text-muted-foreground">Receipt No:</span>
              <span className="info-value font-mono font-semibold">{sale.receiptNumber}</span>
            </div>
            <div className="info-row flex justify-between">
              <span className="info-label text-muted-foreground">Date:</span>
              <span className="info-value">{formatDate(sale.createdAt)}</span>
            </div>
            <div className="info-row flex justify-between">
              <span className="info-label text-muted-foreground">Payment:</span>
              <span className="info-value capitalize">{sale.paymentMethod.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="separator">
            <Separator />
          </div>

          {/* Items */}
          <div className="space-y-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Item</th>
                  <th className="center text-center py-1">Qty</th>
                  <th className="right text-right py-1">Price</th>
                  <th className="right text-right py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">
                      <div>
                        <div className="item-name font-medium">{item.product.name}</div>
                        <div className="item-uom text-xs text-muted-foreground">{item.uom}</div>
                      </div>
                    </td>
                    <td className="center text-center">{Number(item.quantity)}</td>
                    <td className="right text-right">₱{Number(item.unitPrice).toFixed(2)}</td>
                    <td className="right text-right font-medium">
                      ₱{Number(item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="separator">
            <Separator />
          </div>

          {/* Totals */}
          <div className="totals space-y-1 text-sm">
            <div className="total-row flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>₱{Number(sale.subtotal).toFixed(2)}</span>
            </div>
            <div className="total-row flex justify-between">
              <span className="text-muted-foreground">Tax (12%):</span>
              <span>₱{Number(sale.tax).toFixed(2)}</span>
            </div>
            <div className="separator my-2">
              <Separator />
            </div>
            <div className="total-row grand flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₱{Number(sale.totalAmount).toFixed(2)}</span>
            </div>

            {/* Cash Payment Details */}
            {sale.paymentMethod === 'cash' && sale.amountReceived && (
              <>
                <div className="separator my-2">
                  <Separator />
                </div>
                <div className="total-row flex justify-between">
                  <span className="text-muted-foreground">Amount Received:</span>
                  <span>₱{Number(sale.amountReceived).toFixed(2)}</span>
                </div>
                <div className="total-row flex justify-between font-semibold">
                  <span>Change:</span>
                  <span>₱{Number(sale.change || 0).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div className="separator">
            <Separator />
          </div>

          {/* Footer */}
          <div className="footer text-center text-xs text-muted-foreground space-y-1">
            <p>Thank you for your purchase!</p>
            <p>Please come again</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button onClick={onClose} className="flex-1">
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
