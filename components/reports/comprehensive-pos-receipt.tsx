'use client';

import { Printer, X, Download, QrCode, Barcode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { POSSaleWithItems } from '@/types/pos.types';
import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import QRCode from 'qrcode.react';
import Barcode from 'react-barcode';

interface ComprehensivePOSReceiptProps {
  sale: POSSaleWithItems;
  companySettings?: {
    name: string;
    tagline?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    tin?: string;
    logo?: string;
  };
  open: boolean;
  onClose: () => void;
  onPrintComplete?: () => void;
  showBarcode?: boolean;
  showQRCode?: boolean;
  thermalPrinterMode?: boolean;
}

export function ComprehensivePOSReceipt({ 
  sale, 
  companySettings = {
    name: 'InventoryPro',
    tagline: 'Soft Drinks Wholesale',
    address: 'Main Branch',
    phone: '',
    email: '',
    website: '',
    tin: '',
    logo: ''
  },
  open, 
  onClose, 
  onPrintComplete,
  showBarcode = true,
  showQRCode = true,
  thermalPrinterMode = false
}: ComprehensivePOSReceiptProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${sale.receiptNumber}`,
    onBeforePrint: () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      onPrintComplete?.();
    },
    pageStyle: `
      @page {
        size: ${thermalPrinterMode ? '80mm 297mm' : 'A4'};
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: ${thermalPrinterMode ? '5mm' : '10mm'};
        }
        .no-print {
          display: none !important;
        }
        .thermal-only {
          display: ${thermalPrinterMode ? 'block' : 'none'} !important;
        }
        .regular-only {
          display: ${thermalPrinterMode ? 'none' : 'block'} !important;
        }
      }
    `
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₱${Number(amount).toFixed(2)}`;
  };

  const calculateDiscountAmount = () => {
    return sale.items.reduce((total, item) => {
      const originalPrice = item.quantity * item.unitPrice;
      return total + (originalPrice - item.subtotal);
    }, 0);
  };

  const getReceiptDataForQR = () => {
    return {
      receiptNumber: sale.receiptNumber,
      date: sale.createdAt,
      total: sale.totalAmount,
      items: sale.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.subtotal
      }))
    };
  };

  const handleExportPDF = () => {
    // Implementation for PDF export
    console.log('Exporting receipt as PDF...');
  };

  const handleExportImage = () => {
    // Implementation for image export
    console.log('Exporting receipt as image...');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl ${thermalPrinterMode ? 'max-w-sm' : ''}`}>
        <DialogHeader className="no-print">
          <DialogTitle>POS Receipt</DialogTitle>
        </DialogHeader>

        {/* Receipt Content */}
        <div ref={receiptRef} className="space-y-4 p-4 bg-white text-black">
          {/* Header */}
          <div className="receipt-header text-center space-y-1">
            {companySettings.logo && (
              <div className="mb-2">
                <img src={companySettings.logo} alt={companySettings.name} className="h-16 mx-auto" />
              </div>
            )}
            <h2 className="text-xl font-bold">{companySettings.name}</h2>
            {companySettings.tagline && (
              <p className="text-sm text-muted-foreground">{companySettings.tagline}</p>
            )}
            {companySettings.address && (
              <p className="text-xs text-muted-foreground">{companySettings.address}</p>
            )}
            {companySettings.phone && (
              <p className="text-xs text-muted-foreground">Tel: {companySettings.phone}</p>
            )}
            {companySettings.email && (
              <p className="text-xs text-muted-foreground">Email: {companySettings.email}</p>
            )}
            {companySettings.website && (
              <p className="text-xs text-muted-foreground">{companySettings.website}</p>
            )}
            {companySettings.tin && (
              <p className="text-xs text-muted-foreground">TIN: {companySettings.tin}</p>
            )}
            {sale.Branch && (
              <p className="text-xs text-muted-foreground font-semibold">
                {sale.Branch.name} - {sale.Branch.location}
              </p>
            )}
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
              <span className="info-label text-muted-foreground">Cashier:</span>
              <span className="info-value">{sale.cashier?.name || sale.user?.name || 'System'}</span>
            </div>
            {sale.customer && (
              <div className="info-row flex justify-between">
                <span className="info-label text-muted-foreground">Customer:</span>
                <span className="info-value">{sale.customer.name}</span>
              </div>
            )}
            <div className="info-row flex justify-between">
              <span className="info-label text-muted-foreground">Payment:</span>
              <span className="info-value capitalize">
                <Badge variant="outline" className="text-xs">
                  {sale.paymentMethod.replace('_', ' ')}
                </Badge>
              </span>
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
                        {item.discountAmount && item.discountAmount > 0 && (
                          <div className="text-xs text-green-600">
                            Discount: {formatCurrency(item.discountAmount)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="center text-center">{Number(item.quantity)}</td>
                    <td className="right text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="right text-right font-medium">
                      {formatCurrency(item.subtotal)}
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
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            
            {calculateDiscountAmount() > 0 && (
              <div className="total-row flex justify-between text-green-600">
                <span className="text-muted-foreground">Total Discount:</span>
                <span>-{formatCurrency(calculateDiscountAmount())}</span>
              </div>
            )}
            
            {sale.loyaltyPointsUsed && sale.loyaltyPointsUsed > 0 && (
              <div className="total-row flex justify-between text-blue-600">
                <span className="text-muted-foreground">Loyalty Points Used:</span>
                <span>{sale.loyaltyPointsUsed} pts</span>
              </div>
            )}
            
            <div className="total-row flex justify-between">
              <span className="text-muted-foreground">Tax (12%):</span>
              <span>{formatCurrency(sale.tax)}</span>
            </div>
            
            <div className="separator my-2">
              <Separator />
            </div>
            
            <div className="total-row grand flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(sale.totalAmount)}</span>
            </div>

            {/* Payment Details */}
            {sale.paymentMethod === 'cash' && sale.amountReceived && (
              <>
                <div className="separator my-2">
                  <Separator />
                </div>
                <div className="total-row flex justify-between">
                  <span className="text-muted-foreground">Amount Received:</span>
                  <span>{formatCurrency(sale.amountReceived)}</span>
                </div>
                <div className="total-row flex justify-between font-semibold">
                  <span>Change:</span>
                  <span>{formatCurrency(sale.change || 0)}</span>
                </div>
              </>
            )}

            {sale.paymentMethod === 'card' && (
              <div className="total-row flex justify-between text-blue-600">
                <span className="text-muted-foreground">Card Payment:</span>
                <span>{formatCurrency(sale.totalAmount)}</span>
              </div>
            )}

            {sale.paymentMethod === 'credit' && (
              <div className="total-row flex justify-between text-orange-600">
                <span className="text-muted-foreground">Credit Amount:</span>
                <span>{formatCurrency(sale.totalAmount)}</span>
              </div>
            )}
          </div>

          {/* Barcode and QR Code */}
          {(showBarcode || showQRCode) && (
            <>
              <div className="separator">
                <Separator />
              </div>
              <div className="flex justify-center items-center gap-4 py-2">
                {showBarcode && (
                  <div className="text-center">
                    <Barcode value={sale.receiptNumber} width={1} height={40} fontSize={10} />
                    <p className="text-xs text-muted-foreground mt-1">Scan for verification</p>
                  </div>
                )}
                {showQRCode && (
                  <div className="text-center">
                    <QRCode value={JSON.stringify(getReceiptDataForQR())} size={80} />
                    <p className="text-xs text-muted-foreground mt-1">Digital receipt</p>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="separator">
            <Separator />
          </div>

          {/* Footer */}
          <div className="footer text-center text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Thank you for your purchase!</p>
            <p>Please come again</p>
            {sale.loyaltyPointsEarned && sale.loyaltyPointsEarned > 0 && (
              <p className="text-blue-600 font-semibold">
                You earned {sale.loyaltyPointsEarned} loyalty points!
              </p>
            )}
            <p className="text-xs">This receipt serves as your official invoice</p>
            <p className="text-xs">Valid for returns within 7 days with original receipt</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 no-print">
          <Button 
            variant="outline" 
            onClick={handlePrint} 
            className="flex-1"
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? 'Printing...' : 'Print Receipt'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleExportPDF} 
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleExportImage} 
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Image
          </Button>
          
          <Button onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}