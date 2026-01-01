import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  title?: string;
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    tin?: string;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
}

export interface TableData {
  headers: string[];
  data: any[][];
  title?: string;
}

export const exportToPDF = (data: TableData, options: ExportOptions) => {
  const doc = new jsPDF();
  
  // Add company header
  if (options.companyInfo) {
    doc.setFontSize(16);
    doc.text(options.companyInfo.name, 14, 15);
    
    doc.setFontSize(10);
    if (options.companyInfo.address) {
      doc.text(options.companyInfo.address, 14, 22);
    }
    if (options.companyInfo.phone) {
      doc.text(`Phone: ${options.companyInfo.phone}`, 14, 28);
    }
    if (options.companyInfo.email) {
      doc.text(`Email: ${options.companyInfo.email}`, 14, 34);
    }
    if (options.companyInfo.tin) {
      doc.text(`TIN: ${options.companyInfo.tin}`, 14, 40);
    }
  }

  // Add report title
  if (options.title) {
    doc.setFontSize(14);
    doc.text(options.title, 14, 50);
  }

  // Add date range
  if (options.dateRange) {
    doc.setFontSize(10);
    doc.text(
      `Date Range: ${options.dateRange.start.toLocaleDateString()} - ${options.dateRange.end.toLocaleDateString()}`,
      14,
      options.title ? 58 : 50
    );
  }

  // Add filters
  if (options.filters) {
    const filterText = Object.entries(options.filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    if (filterText) {
      doc.setFontSize(10);
      doc.text(`Filters: ${filterText}`, 14, (options.title ? 58 : 50) + 8);
    }
  }

  // Add table
  const startY = (options.title ? 58 : 50) + (options.filters ? 16 : 8);
  autoTable(doc, {
    head: [data.headers],
    body: data.data,
    startY,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Add footer with generation date
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${options.filename}.pdf`);
};

export const exportToExcel = (data: TableData, options: ExportOptions) => {
  const wb = XLSX.utils.book_new();
  
  // Create worksheet data
  const wsData = [
    [],
  ];

  // Add company info
  if (options.companyInfo) {
    wsData.push([options.companyInfo.name]);
    if (options.companyInfo.address) wsData.push([options.companyInfo.address]);
    if (options.companyInfo.phone) wsData.push([`Phone: ${options.companyInfo.phone}`]);
    if (options.companyInfo.email) wsData.push([`Email: ${options.companyInfo.email}`]);
    if (options.companyInfo.tin) wsData.push([`TIN: ${options.companyInfo.tin}`]);
    wsData.push([]);
  }

  // Add title
  if (options.title) {
    wsData.push([options.title]);
  }

  // Add date range
  if (options.dateRange) {
    wsData.push([`Date Range: ${options.dateRange.start.toLocaleDateString()} - ${options.dateRange.end.toLocaleDateString()}`]);
  }

  // Add filters
  if (options.filters) {
    const filterText = Object.entries(options.filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    if (filterText) {
      wsData.push([`Filters: ${filterText}`]);
    }
  }

  wsData.push([]); // Empty row
  wsData.push(data.headers);
  wsData.push(...data.data);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Apply styling
  if (options.companyInfo) {
    ws['A1'] = { v: options.companyInfo.name, s: { font: { bold: true, sz: 14 } } };
  }
  
  if (options.title) {
    const titleRow = options.companyInfo ? (options.companyInfo.address ? 6 : 2) : 1;
    ws[`A${titleRow}`] = { v: options.title, s: { font: { bold: true, sz: 12 } } };
  }

  // Auto-size columns
  const colWidths = data.headers.map((header, index) => {
    const maxLength = Math.max(
      header.length,
      ...data.data.map(row => String(row[index] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${options.filename}.xlsx`);
};

export const exportToCSV = (data: TableData, options: ExportOptions) => {
  let csvContent = '\uFEFF'; // BOM for Excel UTF-8 compatibility

  // Add company info
  if (options.companyInfo) {
    csvContent += `${options.companyInfo.name}\n`;
    if (options.companyInfo.address) csvContent += `${options.companyInfo.address}\n`;
    if (options.companyInfo.phone) csvContent += `Phone: ${options.companyInfo.phone}\n`;
    if (options.companyInfo.email) csvContent += `Email: ${options.companyInfo.email}\n`;
    if (options.companyInfo.tin) csvContent += `TIN: ${options.companyInfo.tin}\n`;
    csvContent += '\n';
  }

  // Add title
  if (options.title) {
    csvContent += `${options.title}\n`;
  }

  // Add date range
  if (options.dateRange) {
    csvContent += `Date Range: ${options.dateRange.start.toLocaleDateString()} - ${options.dateRange.end.toLocaleDateString()}\n`;
  }

  // Add filters
  if (options.filters) {
    const filterText = Object.entries(options.filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    if (filterText) {
      csvContent += `Filters: ${filterText}\n`;
    }
  }

  csvContent += '\n';

  // Add headers
  csvContent += data.headers.map(header => `"${header}"`).join(',') + '\n';

  // Add data
  data.data.forEach(row => {
    csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
  });

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${options.filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportData = (data: TableData, options: ExportOptions) => {
  switch (options.format) {
    case 'pdf':
      exportToPDF(data, options);
      break;
    case 'excel':
      exportToExcel(data, options);
      break;
    case 'csv':
      exportToCSV(data, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};

// Utility functions for specific report types
export const prepareSalesDataForExport = (salesData: any[]) => {
  return {
    headers: ['Date', 'Transactions', 'Revenue', 'COGS', 'Gross Profit', 'Margin %'],
    data: salesData.map(item => [
      new Date(item.date).toLocaleDateString(),
      item.transactionCount,
      new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.totalRevenue)),
      new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.totalCOGS)),
      new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.grossProfit)),
      `${item.grossMargin.toFixed(2)}%`
    ])
  };
};

export const prepareInventoryDataForExport = (inventoryData: any[]) => {
  return {
    headers: ['Product', 'Category', 'Warehouse', 'Current Stock', 'Min Level', 'Status'],
    data: inventoryData.map(item => [
      item.productName,
      item.category,
      item.warehouseName,
      `${item.currentStock} ${item.baseUOM}`,
      item.minStockLevel,
      item.status
    ])
  };
};

export const prepareEmployeePerformanceDataForExport = (performanceData: any[]) => {
  return {
    headers: ['Employee', 'Branch', 'Total Sales', 'Transactions', 'Average Sale', 'Performance Rating'],
    data: performanceData.map(item => [
      item.employeeName,
      item.branchName,
      new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.totalSales)),
      item.totalTransactions,
      new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.averageSale)),
      item.performanceRating
    ])
  };
};