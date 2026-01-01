'use client';

import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, QrCode, Barcode } from 'lucide-react';
import { POSReceipt } from '@/types/report.types';

interface POSReceiptTemplateProps {
  receipt: POSReceipt;
  onPrint?: () => void;
  onDownload?: () => void;
  showActions?: boolean;
}

export function POSReceiptTemplate({ 
  receipt, 
  onPrint, 
  onDownload, 
  showActions = true 
}: POSReceiptTemplateProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt ${receipt.receiptNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 10px; font-size: 12px; }
                .receipt-container { max-width: 300px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 10px; }
                .company-name { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
                .receipt-info { margin-bottom: 10px; }
                .items { margin-bottom: 10px; }
                .item { display: flex; justify-content: space-between; margin-bottom: 2px; }
                .totals { margin-bottom: 10px; }
                .total-line { display: flex; justify-content: space-between; margin-bottom: 2px; }
                .total-line.bold { font-weight: bold; }
                .footer { text-align: center; margin-top: 10px; font-size: 10px; }
                .separator { border-top: 1px dashed #000; margin: 5px 0; }
                @media print {
                  body { margin: 0; padding: 5px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
    onPrint?.();
  };

  return (
    <div className="space-y-4">
      {showActions && (
        <div className="flex gap-2">
          <Button onClick={handlePrint} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button onClick={onDownload} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      )}

      <Card className="p-6 max-w-md mx-auto" ref={receiptRef}>
        {/* Header */}
        <div className="text-center mb-4">
          {receipt.companySettings?.logoUrl && (
            <img 
              src={receipt.companySettings.logoUrl} 
              alt="Company Logo"
              className="h-12 mx-auto mb-2"
            />
          )}
          <div className="font-bold text-lg">
            {receipt.companySettings?.companyName || receipt.branchName}
          </div>
          <div className="text-sm text-muted-foreground">
            {receipt.branchAddress}
          </div>
          <div className="text-sm text-muted-foreground">
            {receipt.branchPhone}
          </div>
          {receipt.companySettings?.taxId && (
            <div className="text-sm text-muted-foreground">
              TIN: {receipt.companySettings.taxId}
            </div>
          )}
          {receipt.companySettings?.receiptHeader && (
            <div className="text-sm mt-2">
              {receipt.companySettings.receiptHeader}
            </div>
          )}
        </div>

        <Separator className="my-3" />

        {/* Receipt Info */}
        <div className="text-sm space-y-1 mb-4">
          <div className="flex justify-between">
            <span>Receipt #:</span>
            <span className="font-mono">{receipt.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formatDate(receipt.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{receipt.cashierName}</span>
          </div>
          {receipt.customerName && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{receipt.customerName}</span>
            </div>
          )}
          {receipt.paymentMethod && (
            <div className="flex justify-between">
              <span>Payment:</span>
              <span className="capitalize">{receipt.paymentMethod}</span>
            </div>
          )}
        </div>

        <Separator className="my-3" />

        {/* Items */}
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2">ITEMS</div>
          {receipt.items.map((item) => (
            <div key={item.id} className="text-sm mb-2">
              <div className="flex justify-between">
                <span>{item.productName}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
              <div className="text-muted-foreground ml-2">
                {item.quantity} {item.uom} × {formatCurrency(item.unitPrice)}
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-3" />

        {/* Totals */}
        <div className="text-sm space-y-1 mb-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(receipt.subtotal)}</span>
          </div>
          {receipt.discountAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount:</span>
              <span>-{formatCurrency(receipt.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatCurrency(receipt.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-1">
            <span>Total:</span>
            <span>{formatCurrency(receipt.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Received:</span>
            <span>{formatCurrency(receipt.amountReceived)}</span>
          </div>
          <div className="flex justify-between">
            <span>Change:</span>
            <span>{formatCurrency(receipt.change)}</span>
          </div>
        </div>

        {receipt.loyaltyPoints > 0 && (
          <>
            <Separator className="my-3" />
            <div className="text-center text-sm mb-4">
              <Badge variant="secondary">
                Points Earned: {receipt.loyaltyPoints}
              </Badge>
            </div>
          </>
        )}

        {receipt.notes && (
          <>
            <Separator className="my-3" />
            <div className="text-sm text-center mb-4">
              {receipt.notes}
            </div>
          </>
        )}

        <Separator className="my-3" />

        {/* Barcode/QR Code */}
        {(receipt.barcode || receipt.qrCode) && (
          <div className="text-center mb-4">
            {receipt.barcode && (
              <div className="mb-2">
                <Barcode className="h-8 w-32 mx-auto" />
                <div className="text-xs font-mono">{receipt.barcode}</div>
              </div>
            )}
            {receipt.qrCode && (
              <div>
                <QrCode className="h-16 w-16 mx-auto" />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          {receipt.companySettings?.receiptFooter && (
            <div className="mb-2">{receipt.companySettings.receiptFooter}</div>
          )}
          {receipt.companySettings?.footerText && (
            <div className="mb-2">{receipt.companySettings.footerText}</div>
          )}
          <div>Thank you for your business!</div>
          <div className="mt-2">Printed: {formatDate(new Date())}</div>
          {receipt.printCount > 0 && (
            <div className="text-xs mt-1">Copy #{receipt.printCount}</div>
          )}
        </div>
      </Card>
    </div>
  );
}