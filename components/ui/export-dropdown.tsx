'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, FileCode } from 'lucide-react';
import { ExportFormat } from '@/lib/export-utils';

interface ExportDropdownProps {
  onExport: (format: ExportFormat) => void;
  isLoading?: boolean;
  variant?: 'outline' | 'default' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ExportDropdown({ 
  onExport, 
  isLoading = false, 
  variant = 'outline',
  size = 'sm',
  className 
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleExport = (format: ExportFormat) => {
    onExport(format);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          disabled={isLoading}
          className={className}
        >
          <Download className={`h-4 w-4 ${size !== 'icon' ? 'mr-2' : ''}`} />
          {size !== 'icon' && (isLoading ? 'Exporting...' : 'Export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileCode className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}