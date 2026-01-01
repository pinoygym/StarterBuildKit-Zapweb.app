'use client';

import { Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AdjustmentSlip } from '@/types/inventory.types';

interface AdjustmentSlipPrintProps {
  adjustment: AdjustmentSlip;
  open: boolean;
  onClose: () => void;
}

export function AdjustmentSlipPrint({ adjustment, open, onClose }: AdjustmentSlipPrintProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const slipContent = document.getElementById('adjustment-slip-content');
    if (!slipContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Adjustment Slip - ${adjustment.referenceNumber || adjustment.referenceId}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              padding: 20px;
              max-width: 1100px;
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
            .adjustment-info {
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
              border: 2px solid #333;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
              background-color: #f8f9fa;
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
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th,
            .items-table td {
              border: 1px solid #ddd;
              padding: 4px 6px;
              text-align: left;
            }
            .items-table th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .items-table td.right {
              text-align: right;
            }
            .items-table td.center {
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inventory Adjustment Slip</DialogTitle>
        </DialogHeader>

        {/* Adjustment Slip Content */}
        <div id="adjustment-slip-content" className="space-y-4 p-6 bg-white text-black">
          {/* Header */}
          <div className="header text-center border-b-2 border-black pb-3">
            <h1 className="text-2xl font-bold">INVENTORY ADJUSTMENT SLIP</h1>
            <h2 className="text-lg text-gray-600">InventoryPro - Inventory Management</h2>
          </div>

          {/* Adjustment Information */}
          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="info-group border border-gray-300 p-3 rounded">
              <h3 className="text-sm font-bold mb-2 text-gray-700">Adjustment Details</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Reference Number:</span>
                  <span className="font-bold font-mono">{adjustment.referenceNumber || adjustment.referenceId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-bold">{formatDate(adjustment.adjustmentDate)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-bold">{adjustment.totalItems}</span>
                </div>
              </div>
            </div>

            <div className="info-group border border-gray-300 p-3 rounded">
              <h3 className="text-sm font-bold mb-2 text-gray-700">Warehouse</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-bold text-right">{adjustment.warehouseName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="items-table w-full border-collapse my-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Product Name</th>
                <th className="border border-gray-300 p-2 text-center">UOM</th>
                <th className="border border-gray-300 p-2 text-center">Base UOM</th>
                <th className="border border-gray-300 p-2 text-center">Conversion</th>
                <th className="border border-gray-300 p-2 text-right">Current Stock</th>
                <th className="border border-gray-300 p-2 text-right">Adjusted Qty</th>
              </tr>
            </thead>
            <tbody>
              {adjustment.items.map((item) => {
                const conversionDisplay = item.conversionFactor && item.conversionUOM
                  ? `1 ${item.conversionUOM} = ${item.conversionFactor} ${item.actualBaseUOM || item.baseUOM}`
                  : '—';

                return (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2">{item.productName}</td>
                    <td className="border border-gray-300 p-2 text-center">{item.baseUOM}</td>
                    <td className="border border-gray-300 p-2 text-center">{item.actualBaseUOM || item.baseUOM}</td>
                    <td className="border border-gray-300 p-2 text-center text-xs">{conversionDisplay}</td>
                    <td className="border border-gray-300 p-2 text-right">{item.systemQuantity ?? '-'}</td>
                    <td className="border border-gray-300 p-2 text-right font-bold">{item.quantity}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Reason Section */}
          <div className="reason-section border border-gray-300 p-3 rounded bg-gray-50">
            <div className="reason-label font-bold text-sm mb-1">Adjustment Reason:</div>
            <p className="text-sm">{adjustment.reason}</p>
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
                <div className="font-bold">Verified By</div>
                <div className="text-gray-600 mt-1">Supervisor</div>
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
            <p>InventoryPro © {new Date().getFullYear()} - All Rights Reserved</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print Adjustment Slip
          </Button>
          <Button onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
