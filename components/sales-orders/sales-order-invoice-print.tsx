'use client';

import { Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SalesOrderWithItems } from '@/types/sales-order.types';

interface SalesOrderInvoicePrintProps {
  salesOrder: SalesOrderWithItems;
  open: boolean;
  onClose: () => void;
  documentType?: 'invoice' | 'delivery-note';
}

export function SalesOrderInvoicePrint({ 
  salesOrder, 
  open, 
  onClose,
  documentType = 'delivery-note' 
}: SalesOrderInvoicePrintProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const docContent = document.getElementById('sales-order-print-content');
    if (!docContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentType === 'invoice' ? 'Invoice' : 'Delivery Note'} - ${salesOrder.orderNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.6;
              padding: 30px;
              max-width: 900px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #333;
              padding-bottom: 15px;
            }
            .header h1 {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #333;
            }
            .header .subtitle {
              font-size: 16px;
              color: #666;
              margin-bottom: 10px;
            }
            .header .doc-number {
              font-size: 20px;
              font-weight: bold;
              color: #000;
              margin-top: 10px;
            }
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 25px;
            }
            .info-box {
              border: 2px solid #ddd;
              padding: 15px;
              border-radius: 8px;
            }
            .info-box h3 {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .info-row {
              display: flex;
              margin-bottom: 6px;
              font-size: 12px;
            }
            .info-label {
              color: #666;
              font-weight: 500;
              min-width: 140px;
            }
            .info-value {
              font-weight: 600;
              color: #000;
            }
            .separator {
              border-top: 1px dashed #999;
              margin: 20px 0;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th {
              background-color: #f5f5f5;
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
              font-weight: bold;
              font-size: 12px;
            }
            .items-table td {
              border: 1px solid #ddd;
              padding: 10px;
              font-size: 12px;
            }
            .items-table td.right {
              text-align: right;
            }
            .items-table td.center {
              text-align: center;
            }
            .items-table tfoot td {
              font-weight: bold;
              background-color: #f9f9f9;
              font-size: 14px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-pending { background-color: #fff3cd; color: #856404; }
            .status-converted { background-color: #d4edda; color: #155724; }
            .status-cancelled { background-color: #f8d7da; color: #721c24; }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 30px;
              margin-top: 60px;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              border-top: 2px solid #000;
              margin-top: 70px;
              padding-top: 8px;
              font-size: 11px;
            }
            .signature-label {
              font-weight: bold;
              margin-bottom: 4px;
            }
            .signature-role {
              color: #666;
              font-size: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 15px;
              border-top: 2px solid #ddd;
              font-size: 10px;
              color: #666;
            }
            .important-note {
              margin-top: 30px;
              padding: 15px;
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              border-radius: 4px;
            }
            .important-note h4 {
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #856404;
            }
            .important-note p {
              font-size: 11px;
              line-height: 1.8;
              color: #856404;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${docContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getStatusClass = (status: string) => {
    return `status-${status.toLowerCase()}`;
  };

  const documentTitle = documentType === 'invoice' ? 'SALES INVOICE' : 'DELIVERY NOTE';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{documentTitle}</DialogTitle>
        </DialogHeader>

        {/* Sales Order Print Content */}
        <div id="sales-order-print-content" className="space-y-4 p-6 bg-white text-black">
          {/* Header */}
          <div className="header text-center border-b-4 border-gray-800 pb-4">
            <h1 className="text-3xl font-bold mb-1">{documentTitle}</h1>
            <div className="subtitle text-lg text-gray-600">InventoryPro - Soft Drinks Wholesale</div>
            <div className="doc-number text-2xl font-bold mt-3">{salesOrder.orderNumber}</div>
            <div className="mt-2">
              <span className={`status-badge ${getStatusClass(salesOrder.salesOrderStatus)}`}>
                {salesOrder.salesOrderStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Information Section */}
          <div className="grid grid-cols-2 gap-6 my-6">
            {/* Customer Information */}
            <div className="info-box border-2 border-gray-300 p-4 rounded-lg">
              <h3 className="text-sm font-bold mb-3 pb-2 border-b border-gray-300">CUSTOMER INFORMATION</h3>
              <div className="space-y-2">
                <div className="flex text-xs">
                  <span className="text-gray-600 font-medium min-w-[120px]">Customer Name:</span>
                  <span className="font-semibold">{salesOrder.customerName}</span>
                </div>
                <div className="flex text-xs">
                  <span className="text-gray-600 font-medium min-w-[120px]">Phone:</span>
                  <span className="font-semibold">{salesOrder.customerPhone}</span>
                </div>
                <div className="flex text-xs">
                  <span className="text-gray-600 font-medium min-w-[120px]">Email:</span>
                  <span className="font-semibold">{salesOrder.customerEmail}</span>
                </div>
                <div className="flex text-xs">
                  <span className="text-gray-600 font-medium min-w-[120px]">Delivery Address:</span>
                  <span className="font-semibold">{salesOrder.deliveryAddress}</span>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="info-box border-2 border-gray-300 p-4 rounded-lg">
              <h3 className="text-sm font-bold mb-3 pb-2 border-b border-gray-300">ORDER DETAILS</h3>
              <div className="space-y-2">
                <div className="flex text-xs">
                  <span className="text-gray-600 font-medium min-w-[120px]">Order Number:</span>
                  <span className="font-semibold font-mono">{salesOrder.orderNumber}</span>
                </div>
                <div className="flex text-xs">
                  <span className="text-gray-600 font-medium min-w-[120px]">Order Date:</span>
                  <span className="font-semibold">{formatDate(salesOrder.createdAt)}</span>
                </div>
                <div className="flex text-xs">
                  <span className="text-gray-600 font-medium min-w-[120px]">Delivery Date:</span>
                  <span className="font-semibold">{formatDate(salesOrder.deliveryDate)}</span>
                </div>
                <div className="flex text-xs">
                  <span className="text-gray-600 font-medium min-w-[120px]">Status:</span>
                  <span className="font-semibold capitalize">{salesOrder.status}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="separator border-t border-dashed border-gray-400 my-5"></div>

          {/* Items Table */}
          <div>
            <h3 className="text-base font-bold mb-3">ORDER ITEMS</h3>
            <table className="items-table w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">#</th>
                  <th className="border border-gray-300 p-2 text-left">Product Description</th>
                  <th className="border border-gray-300 p-2 text-center">UOM</th>
                  <th className="border border-gray-300 p-2 text-right">Quantity</th>
                  {documentType === 'invoice' && (
                    <>
                      <th className="border border-gray-300 p-2 text-right">Unit Price</th>
                      <th className="border border-gray-300 p-2 text-right">Subtotal</th>
                    </>
                  )}
                  {documentType === 'delivery-note' && (
                    <th className="border border-gray-300 p-2 text-center">Received Qty</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {salesOrder.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                    <td className="border border-gray-300 p-2">{item.product?.name || 'Product'}</td>
                    <td className="border border-gray-300 p-2 text-center">{item.uom}</td>
                    <td className="border border-gray-300 p-2 text-right">{Number(item.quantity).toFixed(2)}</td>
                    {documentType === 'invoice' && (
                      <>
                        <td className="border border-gray-300 p-2 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                        <td className="border border-gray-300 p-2 text-right font-semibold">
                          {formatCurrency(Number(item.subtotal))}
                        </td>
                      </>
                    )}
                    {documentType === 'delivery-note' && (
                      <td className="border border-gray-300 p-2 text-center">__________</td>
                    )}
                  </tr>
                ))}
              </tbody>
              {documentType === 'invoice' && (
                <tfoot>
                  <tr className="bg-gray-100">
                    <td colSpan={5} className="border border-gray-300 p-2 text-right font-bold">
                      TOTAL AMOUNT:
                    </td>
                    <td className="border border-gray-300 p-2 text-right font-bold text-lg">
                      {formatCurrency(Number(salesOrder.totalAmount))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Important Note for Delivery Note */}
          {documentType === 'delivery-note' && (
            <div className="important-note mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <h4 className="text-sm font-bold mb-2 text-yellow-800">DELIVERY INSTRUCTIONS:</h4>
              <p className="text-xs text-yellow-800">
                1. Please verify all items and quantities upon delivery.<br />
                2. Sign the &quot;Received Qty&quot; column for each item received.<br />
                3. Report any discrepancies immediately to the delivery personnel.<br />
                4. Keep this document for your records.
              </p>
            </div>
          )}

          {/* Signatures */}
          <div className="signatures grid grid-cols-3 gap-8 mt-16">
            <div className="signature-box text-center">
              <div className="signature-line border-t-2 border-black mt-20 pt-2 text-xs">
                <div className="signature-label font-bold">Prepared By</div>
                <div className="signature-role text-gray-600">Sales Representative</div>
              </div>
            </div>
            <div className="signature-box text-center">
              <div className="signature-line border-t-2 border-black mt-20 pt-2 text-xs">
                <div className="signature-label font-bold">Delivered By</div>
                <div className="signature-role text-gray-600">Delivery Personnel</div>
              </div>
            </div>
            <div className="signature-box text-center">
              <div className="signature-line border-t-2 border-black mt-20 pt-2 text-xs">
                <div className="signature-label font-bold">Received By</div>
                <div className="signature-role text-gray-600">Customer Representative</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer text-center mt-10 pt-4 border-t-2 border-gray-300 text-xs text-gray-600">
            <p>This is a computer-generated document. No signature is required.</p>
            <p className="mt-1">InventoryPro © {new Date().getFullYear()} - All Rights Reserved</p>
            <p className="mt-1">For inquiries, please contact sales@inventorypro.com</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print {documentType === 'invoice' ? 'Invoice' : 'Delivery Note'}
          </Button>
          <Button onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
