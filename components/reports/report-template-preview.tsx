'use client';

import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, Eye } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';

interface ReportTemplatePreviewProps {
  template: any;
  sampleData?: any;
  onPrint?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

export function ReportTemplatePreview({ 
  template, 
  sampleData, 
  onPrint, 
  onExportPDF, 
  onExportExcel 
}: ReportTemplatePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => previewRef.current,
    documentTitle: `${template.name}-preview-${format(new Date(), 'yyyy-MM-dd')}`,
    pageStyle: `
      @page {
        size: ${template.styling.paperSize.toLowerCase()};
        margin: ${template.styling.margins.top}mm ${template.styling.margins.right}mm ${template.styling.margins.bottom}mm ${template.styling.margins.left}mm;
        orientation: ${template.styling.orientation};
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          font-family: ${template.styling.fontFamily}, sans-serif;
          font-size: ${template.styling.fontSize === 'small' ? '10px' : template.styling.fontSize === 'medium' ? '12px' : '14px'};
          color: #000;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  const getHeaderStyle = () => ({
    backgroundColor: template.styling.primaryColor,
    color: 'white',
    padding: '20px',
    textAlign: 'center' as const,
    borderBottom: `2px solid ${template.styling.secondaryColor}`,
  });

  const getFooterStyle = () => ({
    backgroundColor: template.styling.secondaryColor,
    color: 'white',
    padding: '10px',
    textAlign: 'center' as const,
    fontSize: '10px',
    borderTop: `1px solid ${template.styling.accentColor}`,
  });

  const getTableStyle = () => ({
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '20px',
    ...(template.sections.details.showGrid && {
      border: `1px solid ${template.styling.secondaryColor}`,
    }),
  });

  const getTableHeaderStyle = () => ({
    backgroundColor: template.styling.primaryColor,
    color: 'white',
    padding: '10px',
    textAlign: 'left' as const,
    fontWeight: 'bold',
  });

  const getTableCellStyle = (index?: number) => ({
    padding: '8px',
    borderBottom: `1px solid ${template.styling.secondaryColor}`,
    ...(template.sections.details.alternatingRows && index !== undefined && index % 2 === 1 && {
      backgroundColor: '#f8f9fa',
    }),
  });

  const sampleReportData = sampleData || {
    title: 'Sample Sales Report',
    dateRange: 'January 1, 2024 - January 31, 2024',
    summary: {
      totalSales: 125000,
      totalTransactions: 450,
      averageTransaction: 277.78,
      totalTax: 15000,
      totalDiscount: 8500,
    },
    details: [
      { date: '2024-01-01', transactions: 15, sales: 4200, tax: 504, discount: 200 },
      { date: '2024-01-02', transactions: 18, sales: 5100, tax: 612, discount: 300 },
      { date: '2024-01-03', transactions: 12, sales: 3400, tax: 408, discount: 150 },
      { date: '2024-01-04', transactions: 20, sales: 5600, tax: 672, discount: 400 },
      { date: '2024-01-05', transactions: 16, sales: 4500, tax: 540, discount: 250 },
    ],
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-xl font-semibold">Report Template Preview</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Preview
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Report Preview */}
      <div 
        ref={previewRef} 
        className="bg-white text-black shadow-lg"
        style={{
          fontFamily: `${template.styling.fontFamily}, sans-serif`,
          fontSize: template.styling.fontSize === 'small' ? '10px' : template.styling.fontSize === 'medium' ? '12px' : '14px',
          color: '#000',
          lineHeight: '1.4',
        }}
      >
        {/* Header */}
        {template.sections.header.enabled && (
          <div style={getHeaderStyle()}>
            {template.sections.header.showLogo && template.companySettings.logoUrl && (
              <div style={{ marginBottom: '10px' }}>
                <img 
                  src={template.companySettings.logoUrl} 
                  alt="Company Logo" 
                  style={{ maxHeight: '60px', maxWidth: '200px' }}
                />
              </div>
            )}
            {template.sections.header.showCompanyName && (
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                {template.companySettings.name}
              </h1>
            )}
            {template.sections.header.showAddress && template.companySettings.address && (
              <p style={{ margin: '0 0 5px 0' }}>{template.companySettings.address}</p>
            )}
            {template.sections.header.showContact && (template.companySettings.phone || template.companySettings.email) && (
              <p style={{ margin: '0 0 5px 0' }}>
                {template.companySettings.phone && `Tel: ${template.companySettings.phone}`}
                {template.companySettings.phone && template.companySettings.email && ' | '}
                {template.companySettings.email && `Email: ${template.companySettings.email}`}
              </p>
            )}
            {template.companySettings.taxId && (
              <p style={{ margin: '0 0 5px 0' }}>TIN: {template.companySettings.taxId}</p>
            )}
            {template.sections.header.showDate && (
              <p style={{ margin: '5px 0 0 0', fontSize: '10px' }}>
                Generated on: {format(new Date(), 'MMMM dd, yyyy HH:mm:ss')}
              </p>
            )}
            {template.sections.header.showReportTitle && (
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '15px 0 0 0' }}>
                {sampleReportData.title}
              </h2>
            )}
            {template.sections.header.customText && (
              <p style={{ margin: '10px 0 0 0', fontStyle: 'italic' }}>
                {template.sections.header.customText}
              </p>
            )}
          </div>
        )}

        {/* Report Content */}
        <div style={{ padding: '20px' }}>
          {/* Date Range */}
          <p style={{ fontSize: '12px', color: template.styling.secondaryColor, marginBottom: '20px' }}>
            Report Period: {sampleReportData.dateRange}
          </p>

          {/* Summary Section */}
          {template.sections.summary.enabled && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: template.styling.primaryColor,
                marginBottom: '15px',
                borderBottom: `2px solid ${template.styling.accentColor}`,
                paddingBottom: '5px'
              }}>
                Summary
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {template.sections.summary.showTotals && (
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '4px',
                    borderLeft: `4px solid ${template.styling.primaryColor}`
                  }}>
                    <div style={{ fontSize: '12px', color: template.styling.secondaryColor }}>Total Sales</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: template.styling.primaryColor }}>
                      ₱{sampleReportData.summary.totalSales.toLocaleString()}
                    </div>
                  </div>
                )}
                {template.sections.summary.showTotals && (
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '4px',
                    borderLeft: `4px solid ${template.styling.accentColor}`
                  }}>
                    <div style={{ fontSize: '12px', color: template.styling.secondaryColor }}>Total Transactions</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: template.styling.accentColor }}>
                      {sampleReportData.summary.totalTransactions.toLocaleString()}
                    </div>
                  </div>
                )}
                {template.sections.summary.showAverages && (
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '4px',
                    borderLeft: `4px solid ${template.styling.secondaryColor}`
                  }}>
                    <div style={{ fontSize: '12px', color: template.styling.secondaryColor }}>Average Transaction</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: template.styling.secondaryColor }}>
                      ₱{sampleReportData.summary.averageTransaction.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details Section */}
          {template.sections.details.enabled && (
            <div>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: template.styling.primaryColor,
                marginBottom: '15px',
                borderBottom: `2px solid ${template.styling.accentColor}`,
                paddingBottom: '5px'
              }}>
                Details
              </h3>
              <table style={getTableStyle()}>
                <thead>
                  <tr>
                    <th style={getTableHeaderStyle()}>Date</th>
                    <th style={getTableHeaderStyle()}>Transactions</th>
                    <th style={getTableHeaderStyle()}>Sales</th>
                    <th style={getTableHeaderStyle()}>Tax</th>
                    <th style={getTableHeaderStyle()}>Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleReportData.details.map((row: any, index: number) => (
                    <tr key={index}>
                      <td style={getTableCellStyle(index)}>{row.date}</td>
                      <td style={getTableCellStyle(index)}>{row.transactions}</td>
                      <td style={getTableCellStyle(index)}>₱{row.sales.toLocaleString()}</td>
                      <td style={getTableCellStyle(index)}>₱{row.tax.toLocaleString()}</td>
                      <td style={getTableCellStyle(index)}>₱{row.discount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        {template.sections.footer.enabled && (
          <div style={getFooterStyle()}>
            {template.sections.footer.showPageNumbers && (
              <p style={{ margin: '0 0 5px 0' }}>Page 1 of 1</p>
            )}
            {template.sections.footer.showCompanyInfo && template.companySettings.website && (
              <p style={{ margin: '0 0 5px 0' }}>Website: {template.companySettings.website}</p>
            )}
            {template.sections.footer.showDisclaimer && (
              <p style={{ margin: '0 0 5px 0' }}>
                This report is confidential and for internal use only.
              </p>
            )}
            {template.sections.footer.customText && (
              <p style={{ margin: '5px 0 0 0', fontStyle: 'italic' }}>
                {template.sections.footer.customText}
              </p>
            )}
            <p style={{ margin: '10px 0 0 0', fontSize: '9px' }}>
              Generated by InventoryPro System
            </p>
          </div>
        )}
      </div>
    </div>
  );
}