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

interface TransferSlipData {
  transferNumber: string;
  transferDate: Date | string;
  productName: string;
  batchNumber: string;
  quantity: number;
  uom: string;
  sourceWarehouse: {
    name: string;
    location: string;
  };
  destinationWarehouse: {
    name: string;
    location: string;
  };
  reason: string;
  authorizedBy?: string;
}

interface TransferSlipPrintProps {
  transfer: TransferSlipData;
  open: boolean;
  onClose: () => void;
}

export function TransferSlipPrint({ transfer, open, onClose }: TransferSlipPrintProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const slipContent = document.getElementById('transfer-slip-content');
    if (!slipContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transfer Slip - ${transfer.transferNumber}</title>
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
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .header h1 {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .header h2 {
              font-size: 18px;
              color: #666;
            }
            .transfer-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 20px;
            }
            .info-group {
              border: 1px solid #ddd;
              padding: 10px;
              border-radius: 4px;
            }
            .info-group h3 {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #333;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              font-size: 12px;
            }
            .info-label {
              color: #666;
              font-weight: 500;
            }
            .info-value {
              font-weight: bold;
              text-align: right;
            }
            .separator {
              border-top: 1px dashed #000;
              margin: 16px 0;
            }
            .warehouse-section {
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              gap: 20px;
              margin: 20px 0;
              align-items: center;
            }
            .warehouse-box {
              border: 2px solid #333;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
            .warehouse-box.from {
              background-color: #fff3cd;
              border-color: #ffc107;
            }
            .warehouse-box.to {
              background-color: #d4edda;
              border-color: #28a745;
            }
            .warehouse-label {
              font-size: 10px;
              text-transform: uppercase;
              color: #666;
              margin-bottom: 4px;
            }
            .warehouse-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .warehouse-location {
              font-size: 11px;
              color: #666;
            }
            .arrow {
              font-size: 32px;
              color: #333;
            }
            .product-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .product-table th,
            .product-table td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            .product-table th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .product-table td.right {
              text-align: right;
            }
            .product-table td.center {
              text-align: center;
            }
            .reason-section {
              border: 1px solid #ddd;
              padding: 10px;
              border-radius: 4px;
              margin: 20px 0;
              background-color: #f8f9fa;
            }
            .reason-label {
              font-weight: bold;
              margin-bottom: 4px;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              margin-top: 40px;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 60px;
              padding-top: 4px;
              font-size: 11px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              font-size: 10px;
              color: #666;
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
          ${slipContent.innerHTML}
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
    return d.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Transfer Slip</DialogTitle>
        </DialogHeader>

        {/* Transfer Slip Content */}
        <div id="transfer-slip-content" className="space-y-4 p-6 bg-white text-black">
          {/* Header */}
          <div className="header text-center border-b-2 border-black pb-3">
            <h1 className="text-2xl font-bold">STOCK TRANSFER SLIP</h1>
            <h2 className="text-lg text-gray-600">InventoryPro - Inventory Management</h2>
          </div>

          {/* Transfer Information */}
          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="info-group border border-gray-300 p-3 rounded">
              <h3 className="text-sm font-bold mb-2 text-gray-700">Transfer Details</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Transfer Number:</span>
                  <span className="font-bold font-mono">{transfer.transferNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-bold">{formatDate(transfer.transferDate)}</span>
                </div>
                {transfer.authorizedBy && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Authorized By:</span>
                    <span className="font-bold">{transfer.authorizedBy}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="info-group border border-gray-300 p-3 rounded">
              <h3 className="text-sm font-bold mb-2 text-gray-700">Product Information</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-bold text-right">{transfer.productName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Batch Number:</span>
                  <span className="font-bold font-mono">{transfer.batchNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-bold">{transfer.quantity} {transfer.uom}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="separator border-t border-dashed border-gray-400 my-4"></div>

          {/* Warehouse Movement */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center my-6">
            <div className="warehouse-box from border-2 border-yellow-500 bg-yellow-50 p-4 rounded-lg text-center">
              <div className="warehouse-label text-xs uppercase text-gray-600 mb-1">From</div>
              <div className="warehouse-name text-lg font-bold mb-1">{transfer.sourceWarehouse.name}</div>
              <div className="warehouse-location text-xs text-gray-600">{transfer.sourceWarehouse.location}</div>
            </div>

            <div className="arrow text-4xl text-gray-700">→</div>

            <div className="warehouse-box to border-2 border-green-500 bg-green-50 p-4 rounded-lg text-center">
              <div className="warehouse-label text-xs uppercase text-gray-600 mb-1">To</div>
              <div className="warehouse-name text-lg font-bold mb-1">{transfer.destinationWarehouse.name}</div>
              <div className="warehouse-location text-xs text-gray-600">{transfer.destinationWarehouse.location}</div>
            </div>
          </div>

          {/* Product Details Table */}
          <table className="product-table w-full border-collapse my-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Product Name</th>
                <th className="border border-gray-300 p-2 text-center">Batch Number</th>
                <th className="border border-gray-300 p-2 text-center">UOM</th>
                <th className="border border-gray-300 p-2 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">{transfer.productName}</td>
                <td className="border border-gray-300 p-2 text-center font-mono">{transfer.batchNumber}</td>
                <td className="border border-gray-300 p-2 text-center">{transfer.uom}</td>
                <td className="border border-gray-300 p-2 text-right font-bold">{transfer.quantity}</td>
              </tr>
            </tbody>
          </table>

          {/* Reason Section */}
          <div className="reason-section border border-gray-300 p-3 rounded bg-gray-50">
            <div className="reason-label font-bold text-sm mb-1">Transfer Reason:</div>
            <p className="text-sm">{transfer.reason}</p>
          </div>

          {/* Signatures */}
          <div className="signatures grid grid-cols-3 gap-6 mt-10">
            <div className="signature-box text-center">
              <div className="signature-line border-t border-black mt-16 pt-1 text-xs">
                <div className="font-bold">Prepared By</div>
                <div className="text-gray-600 mt-1">Warehouse Staff</div>
              </div>
            </div>
            <div className="signature-box text-center">
              <div className="signature-line border-t border-black mt-16 pt-1 text-xs">
                <div className="font-bold">Received By</div>
                <div className="text-gray-600 mt-1">Destination Warehouse</div>
              </div>
            </div>
            <div className="signature-box text-center">
              <div className="signature-line border-t border-black mt-16 pt-1 text-xs">
                <div className="font-bold">Approved By</div>
                <div className="text-gray-600 mt-1">Manager</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer text-center mt-8 pt-3 border-t border-gray-300 text-xs text-gray-600">
            <p>This is a computer-generated document. No signature is required.</p>
            <p className="mt-1">InventoryPro © {new Date().getFullYear()} - All Rights Reserved</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print Transfer Slip
          </Button>
          <Button onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
