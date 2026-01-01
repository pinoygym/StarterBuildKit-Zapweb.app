'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Printer, 
  FileText, 
  Download, 
  Calendar,
  Users,
  Package,
  TrendingUp,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface BatchPrintJob {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: any;
  selected: boolean;
}

interface BatchPrintSettings {
  copies: number;
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  includeHeaders: boolean;
  includeFooters: boolean;
  printDate: boolean;
  printCompanyInfo: boolean;
}

export function BatchPrintManager() {
  const [printJobs, setPrintJobs] = useState<BatchPrintJob[]>([
    {
      id: 'stock-levels',
      type: 'inventory',
      title: 'Stock Level Report',
      description: 'Current inventory levels and stock status',
      icon: Package,
      selected: false,
    },
    {
      id: 'inventory-value',
      type: 'inventory',
      title: 'Inventory Valuation Report',
      description: 'Total inventory value and cost analysis',
      icon: TrendingUp,
      selected: false,
    },
    {
      id: 'best-sellers',
      type: 'sales',
      title: 'Best Selling Products',
      description: 'Top performing products by sales volume',
      icon: TrendingUp,
      selected: false,
    },
    {
      id: 'sales-summary',
      type: 'sales',
      title: 'Sales Summary Report',
      description: 'Daily sales performance and metrics',
      icon: Calendar,
      selected: false,
    },
    {
      id: 'employee-performance',
      type: 'performance',
      title: 'Employee Performance Report',
      description: 'Individual sales performance and targets',
      icon: Users,
      selected: false,
    },
    {
      id: 'promotion-analytics',
      type: 'analytics',
      title: 'Promotion Analytics',
      description: 'Discount and promotion usage analysis',
      icon: TrendingUp,
      selected: false,
    },
  ]);

  const [settings, setSettings] = useState<BatchPrintSettings>({
    copies: 1,
    paperSize: 'A4',
    orientation: 'portrait',
    includeHeaders: true,
    includeFooters: true,
    printDate: true,
    printCompanyInfo: true,
  });

  const [isPrinting, setIsPrinting] = useState(false);

  const handleJobSelection = (jobId: string, selected: boolean) => {
    setPrintJobs(jobs => 
      jobs.map(job => 
        job.id === jobId ? { ...job, selected } : job
      )
    );
  };

  const handleSelectAll = (selectAll: boolean) => {
    setPrintJobs(jobs => 
      jobs.map(job => ({ ...job, selected: selectAll }))
    );
  };

  const handlePrintSelected = async () => {
    const selectedJobs = printJobs.filter(job => job.selected);
    
    if (selectedJobs.length === 0) {
      toast.error('Please select at least one report to print');
      return;
    }

    setIsPrinting(true);
    
    try {
      // Simulate printing process
      for (let i = 0; i < selectedJobs.length; i++) {
        const job = selectedJobs[i];
        toast.info(`Printing ${job.title} (${i + 1} of ${selectedJobs.length})...`);
        
        // Simulate print delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real implementation, you would:
        // 1. Generate the report data
        // 2. Apply the print settings
        // 3. Send to printer
        // 4. Handle thermal printer support if needed
        
        toast.success(`${job.title} printed successfully`);
      }
      
      toast.success(`Batch printing completed: ${selectedJobs.length} reports printed`);
    } catch (error) {
      console.error('Batch printing error:', error);
      toast.error('Batch printing failed');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportSelected = async (format: 'pdf' | 'excel' | 'csv') => {
    const selectedJobs = printJobs.filter(job => job.selected);
    
    if (selectedJobs.length === 0) {
      toast.error('Please select at least one report to export');
      return;
    }

    try {
      for (const job of selectedJobs) {
        // In a real implementation, you would:
        // 1. Generate the report data based on job.type and job.id
        // 2. Apply export settings
        // 3. Export to the selected format
        
        toast.info(`Exporting ${job.title} as ${format.toUpperCase()}...`);
        
        // Simulate export delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast.success(`${job.title} exported as ${format.toUpperCase()}`);
      }
      
      toast.success(`Batch export completed: ${selectedJobs.length} reports exported`);
    } catch (error) {
      console.error('Batch export error:', error);
      toast.error('Batch export failed');
    }
  };

  const selectedCount = printJobs.filter(job => job.selected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Batch Print Manager</h2>
          <p className="text-muted-foreground">
            Select multiple reports to print or export simultaneously
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSelectAll(true)}
            disabled={isPrinting}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSelectAll(false)}
            disabled={isPrinting}
          >
            Deselect All
          </Button>
        </div>
      </div>

      {/* Print Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Print Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="copies">Copies</Label>
              <Input
                id="copies"
                type="number"
                min="1"
                max="10"
                value={settings.copies}
                onChange={(e) => setSettings(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paper-size">Paper Size</Label>
              <Select
                value={settings.paperSize}
                onValueChange={(value) => setSettings(prev => ({ ...prev, paperSize: value }))}
              >
                <SelectTrigger id="paper-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Thermal">Thermal (80mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orientation">Orientation</Label>
              <Select
                value={settings.orientation}
                onValueChange={(value) => setSettings(prev => ({ ...prev, orientation: value as 'portrait' | 'landscape' }))}
              >
                <SelectTrigger id="orientation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-headers"
                checked={settings.includeHeaders}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeHeaders: checked as boolean }))}
              />
              <Label htmlFor="include-headers">Include report headers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-footers"
                checked={settings.includeFooters}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeFooters: checked as boolean }))}
              />
              <Label htmlFor="include-footers">Include report footers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="print-date"
                checked={settings.printDate}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, printDate: checked as boolean }))}
              />
              <Label htmlFor="print-date">Print generation date</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="print-company-info"
                checked={settings.printCompanyInfo}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, printCompanyInfo: checked as boolean }))}
              />
              <Label htmlFor="print-company-info">Print company information</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Available Reports
            </span>
            <Badge variant="secondary">
              {selectedCount} selected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {printJobs.map((job) => {
              const Icon = job.icon;
              return (
                <div
                  key={job.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    job.selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleJobSelection(job.id, !job.selected)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-medium leading-none">
                        {job.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Checkbox
                        checked={job.selected}
                        onChange={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedCount > 0 
            ? `${selectedCount} report${selectedCount !== 1 ? 's' : ''} selected for batch processing`
            : 'Select reports to enable batch operations'
          }
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExportSelected('pdf')}
            disabled={selectedCount === 0 || isPrinting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportSelected('excel')}
            disabled={selectedCount === 0 || isPrinting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportSelected('csv')}
            disabled={selectedCount === 0 || isPrinting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={handlePrintSelected}
            disabled={selectedCount === 0 || isPrinting}
            className="min-w-[120px]"
          >
            <Printer className={`h-4 w-4 mr-2 ${isPrinting ? 'animate-spin' : ''}`} />
            {isPrinting ? 'Printing...' : 'Print Selected'}
          </Button>
        </div>
      </div>
    </div>
  );
}