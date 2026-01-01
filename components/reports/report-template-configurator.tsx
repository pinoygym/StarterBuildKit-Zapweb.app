'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUpload } from '@/components/products/image-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Upload, Eye, Download, Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { ReportType } from '@/types/report.types';

interface ReportTemplateConfig {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  companySettings: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    taxId?: string;
    website?: string;
    logoUrl?: string;
    headerText?: string;
    footerText?: string;
  };
  styling: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    fontSize: 'small' | 'medium' | 'large';
    paperSize: 'A4' | 'Letter' | 'Legal' | 'Thermal';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  sections: {
    header: {
      enabled: boolean;
      showLogo: boolean;
      showCompanyName: boolean;
      showAddress: boolean;
      showContact: boolean;
      showDate: boolean;
      showReportTitle: boolean;
      customText?: string;
    };
    footer: {
      enabled: boolean;
      showPageNumbers: boolean;
      showCompanyInfo: boolean;
      showDisclaimer: boolean;
      customText?: string;
    };
    summary: {
      enabled: boolean;
      showTotals: boolean;
      showAverages: boolean;
      showPercentages: boolean;
    };
    details: {
      enabled: boolean;
      showGrid: boolean;
      alternatingRows: boolean;
      groupBy?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };
  };
  filters: {
    dateRange: boolean;
    branch: boolean;
    category: boolean;
    customer: boolean;
    employee: boolean;
    product: boolean;
  };
  isDefault: boolean;
  isActive: boolean;
}

interface ReportTemplateConfiguratorProps {
  template?: ReportTemplateConfig;
  onSave?: (template: ReportTemplateConfig) => void;
  onCancel?: () => void;
  onPreview?: (template: ReportTemplateConfig) => void;
}

const defaultTemplate: ReportTemplateConfig = {
  id: '',
  name: '',
  type: 'SALES_SUMMARY',
  description: '',
  companySettings: {
    name: 'Your Company Name',
    address: 'Your Company Address',
    phone: '',
    email: '',
    taxId: '',
    website: '',
    logoUrl: '',
    headerText: '',
    footerText: '',
  },
  styling: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    fontFamily: 'Inter',
    fontSize: 'medium',
    paperSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
  },
  sections: {
    header: {
      enabled: true,
      showLogo: true,
      showCompanyName: true,
      showAddress: true,
      showContact: true,
      showDate: true,
      showReportTitle: true,
      customText: '',
    },
    footer: {
      enabled: true,
      showPageNumbers: true,
      showCompanyInfo: true,
      showDisclaimer: true,
      customText: '',
    },
    summary: {
      enabled: true,
      showTotals: true,
      showAverages: true,
      showPercentages: true,
    },
    details: {
      enabled: true,
      showGrid: true,
      alternatingRows: true,
    },
  },
  filters: {
    dateRange: true,
    branch: true,
    category: true,
    customer: true,
    employee: true,
    product: true,
  },
  isDefault: false,
  isActive: true,
};

export function ReportTemplateConfigurator({ 
  template, 
  onSave, 
  onCancel, 
  onPreview 
}: ReportTemplateConfiguratorProps) {
  const [config, setConfig] = useState<ReportTemplateConfig>(template || defaultTemplate);
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSave = async () => {
    if (!config.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const templateWithId = {
        ...config,
        id: config.id || Date.now().toString(),
      };
      
      onSave?.(templateWithId);
      toast.success('Template saved successfully');
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    onPreview?.(config);
    setPreviewMode(true);
  };

  const handleLogoChange = (url: string) => {
    setConfig(prev => ({
      ...prev,
      companySettings: {
        ...prev.companySettings,
        logoUrl: url,
      },
    }));
  };

  const handleLogoRemove = () => {
    setConfig(prev => ({
      ...prev,
      companySettings: {
        ...prev.companySettings,
        logoUrl: '',
      },
    }));
  };

  const updateCompanySetting = (field: keyof typeof config.companySettings, value: string) => {
    setConfig(prev => ({
      ...prev,
      companySettings: {
        ...prev.companySettings,
        [field]: value,
      },
    }));
  };

  const updateStyling = (field: keyof typeof config.styling, value: any) => {
    setConfig(prev => ({
      ...prev,
      styling: {
        ...prev.styling,
        [field]: value,
      },
    }));
  };

  const updateSection = (section: keyof typeof config.sections, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: {
          ...prev.sections[section],
          [field]: value,
        },
      },
    }));
  };

  const updateFilter = (filter: keyof typeof config.filters, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filter]: value,
      },
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {template ? 'Edit Report Template' : 'Create Report Template'}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="company">Company Info</TabsTrigger>
          <TabsTrigger value="styling">Styling</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select
                  value={config.type}
                  onValueChange={(value: ReportType) => setConfig(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="reportType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POS_RECEIPT">POS Receipt</SelectItem>
                    <SelectItem value="SALES_SUMMARY">Sales Summary</SelectItem>
                    <SelectItem value="INVENTORY_MOVEMENT">Inventory Movement</SelectItem>
                    <SelectItem value="CUSTOMER_HISTORY">Customer History</SelectItem>
                    <SelectItem value="EMPLOYEE_PERFORMANCE">Employee Performance</SelectItem>
                    <SelectItem value="DISCOUNT_ANALYTICS">Discount Analytics</SelectItem>
                    <SelectItem value="PROFIT_LOSS">Profit & Loss</SelectItem>
                    <SelectItem value="BALANCE_SHEET">Balance Sheet</SelectItem>
                    <SelectItem value="CASH_FLOW">Cash Flow</SelectItem>
                    <SelectItem value="CUSTOM">Custom Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={config.description || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={config.isDefault}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isDefault: !!checked }))}
                />
                <Label htmlFor="isDefault">Set as default template</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={config.isActive}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isActive: !!checked }))}
                />
                <Label htmlFor="isActive">Active template</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Information */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyLogo">Company Logo</Label>
                <div className="flex items-center gap-4">
                  {config.companySettings.logoUrl && (
                    <img 
                      src={config.companySettings.logoUrl} 
                      alt="Company Logo" 
                      className="h-16 w-16 object-contain border rounded"
                    />
                  )}
                  <ImageUpload
                    value={config.companySettings.logoUrl || ''}
                    onChange={handleLogoChange}
                    onRemove={handleLogoRemove}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={config.companySettings.name}
                  onChange={(e) => updateCompanySetting('name', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <Label htmlFor="companyAddress">Address</Label>
                <Textarea
                  id="companyAddress"
                  value={config.companySettings.address || ''}
                  onChange={(e) => updateCompanySetting('address', e.target.value)}
                  placeholder="Enter company address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyPhone">Phone</Label>
                  <Input
                    id="companyPhone"
                    value={config.companySettings.phone || ''}
                    onChange={(e) => updateCompanySetting('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    value={config.companySettings.email || ''}
                    onChange={(e) => updateCompanySetting('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={config.companySettings.taxId || ''}
                    onChange={(e) => updateCompanySetting('taxId', e.target.value)}
                    placeholder="Enter tax ID"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={config.companySettings.website || ''}
                    onChange={(e) => updateCompanySetting('website', e.target.value)}
                    placeholder="Enter website URL"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="headerText">Custom Header Text</Label>
                <Textarea
                  id="headerText"
                  value={config.companySettings.headerText || ''}
                  onChange={(e) => updateCompanySetting('headerText', e.target.value)}
                  placeholder="Enter custom header text"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="footerText">Custom Footer Text</Label>
                <Textarea
                  id="footerText"
                  value={config.companySettings.footerText || ''}
                  onChange={(e) => updateCompanySetting('footerText', e.target.value)}
                  placeholder="Enter custom footer text"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Styling */}
        <TabsContent value="styling">
          <Card>
            <CardHeader>
              <CardTitle>Report Styling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={config.styling.primaryColor}
                    onChange={(e) => updateStyling('primaryColor', e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={config.styling.secondaryColor}
                    onChange={(e) => updateStyling('secondaryColor', e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <Input
                    id="accentColor"
                    type="color"
                    value={config.styling.accentColor}
                    onChange={(e) => updateStyling('accentColor', e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    value={config.styling.fontFamily}
                    onValueChange={(value) => updateStyling('fontFamily', value)}
                  >
                    <SelectTrigger id="fontFamily">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Select
                    value={config.styling.fontSize}
                    onValueChange={(value: 'small' | 'medium' | 'large') => updateStyling('fontSize', value)}
                  >
                    <SelectTrigger id="fontSize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (10px)</SelectItem>
                      <SelectItem value="medium">Medium (12px)</SelectItem>
                      <SelectItem value="large">Large (14px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paperSize">Paper Size</Label>
                  <Select
                    value={config.styling.paperSize}
                    onValueChange={(value) => updateStyling('paperSize', value)}
                  >
                    <SelectTrigger id="paperSize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                      <SelectItem value="Letter">Letter (8.5×11")</SelectItem>
                      <SelectItem value="Legal">Legal (8.5×14")</SelectItem>
                      <SelectItem value="Thermal">Thermal (80mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="orientation">Orientation</Label>
                  <Select
                    value={config.styling.orientation}
                    onValueChange={(value: 'portrait' | 'landscape') => updateStyling('orientation', value)}
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

              <div>
                <Label>Page Margins (mm)</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="marginTop" className="text-xs">Top</Label>
                    <Input
                      id="marginTop"
                      type="number"
                      value={config.styling.margins.top}
                      onChange={(e) => updateStyling('margins', { ...config.styling.margins, top: Number(e.target.value) })}
                      min={0}
                      max={50}
                    />
                  </div>
                  <div>
                    <Label htmlFor="marginRight" className="text-xs">Right</Label>
                    <Input
                      id="marginRight"
                      type="number"
                      value={config.styling.margins.right}
                      onChange={(e) => updateStyling('margins', { ...config.styling.margins, right: Number(e.target.value) })}
                      min={0}
                      max={50}
                    />
                  </div>
                  <div>
                    <Label htmlFor="marginBottom" className="text-xs">Bottom</Label>
                    <Input
                      id="marginBottom"
                      type="number"
                      value={config.styling.margins.bottom}
                      onChange={(e) => updateStyling('margins', { ...config.styling.margins, bottom: Number(e.target.value) })}
                      min={0}
                      max={50}
                    />
                  </div>
                  <div>
                    <Label htmlFor="marginLeft" className="text-xs">Left</Label>
                    <Input
                      id="marginLeft"
                      type="number"
                      value={config.styling.margins.left}
                      onChange={(e) => updateStyling('margins', { ...config.styling.margins, left: Number(e.target.value) })}
                      min={0}
                      max={50}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections */}
        <TabsContent value="sections">
          <div className="space-y-4">
            {/* Header Section */}
            <Card>
              <CardHeader>
                <CardTitle>Header Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                  id="headerEnabled"
                  checked={config.sections.header.enabled}
                  onCheckedChange={(checked) => updateSection('header', 'enabled', !!checked)}
                  />
                  <Label htmlFor="headerEnabled">Enable Header</Label>
                </div>

                {config.sections.header.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showLogo"
                        checked={config.sections.header.showLogo}
                        onCheckedChange={(checked) => updateSection('header', 'showLogo', !!checked)}
                      />
                      <Label htmlFor="showLogo">Show Logo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showCompanyName"
                        checked={config.sections.header.showCompanyName}
                        onCheckedChange={(checked) => updateSection('header', 'showCompanyName', !!checked)}
                      />
                      <Label htmlFor="showCompanyName">Show Company Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showAddress"
                        checked={config.sections.header.showAddress}
                        onCheckedChange={(checked) => updateSection('header', 'showAddress', !!checked)}
                      />
                      <Label htmlFor="showAddress">Show Address</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showContact"
                        checked={config.sections.header.showContact}
                        onCheckedChange={(checked) => updateSection('header', 'showContact', !!checked)}
                      />
                      <Label htmlFor="showContact">Show Contact Info</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showDate"
                        checked={config.sections.header.showDate}
                        onCheckedChange={(checked) => updateSection('header', 'showDate', !!checked)}
                      />
                      <Label htmlFor="showDate">Show Date</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showReportTitle"
                        checked={config.sections.header.showReportTitle}
                        onCheckedChange={(checked) => updateSection('header', 'showReportTitle', !!checked)}
                      />
                      <Label htmlFor="showReportTitle">Show Report Title</Label>
                    </div>
                  </div>
                )}

                {config.sections.header.enabled && (
                  <div>
                    <Label htmlFor="headerCustomText">Custom Header Text</Label>
                    <Textarea
                      id="headerCustomText"
                      value={config.sections.header.customText || ''}
                      onChange={(e) => updateSection('header', 'customText', e.target.value)}
                      placeholder="Enter custom header text"
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer Section */}
            <Card>
              <CardHeader>
                <CardTitle>Footer Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="footerEnabled"
                    checked={config.sections.footer.enabled}
                    onCheckedChange={(checked) => updateSection('footer', 'enabled', !!checked)}
                  />
                  <Label htmlFor="footerEnabled">Enable Footer</Label>
                </div>

                {config.sections.footer.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showPageNumbers"
                        checked={config.sections.footer.showPageNumbers}
                        onCheckedChange={(checked) => updateSection('footer', 'showPageNumbers', !!checked)}
                      />
                      <Label htmlFor="showPageNumbers">Show Page Numbers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showCompanyInfo"
                        checked={config.sections.footer.showCompanyInfo}
                        onCheckedChange={(checked) => updateSection('footer', 'showCompanyInfo', !!checked)}
                      />
                      <Label htmlFor="showCompanyInfo">Show Company Info</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showDisclaimer"
                        checked={config.sections.footer.showDisclaimer}
                        onCheckedChange={(checked) => updateSection('footer', 'showDisclaimer', !!checked)}
                      />
                      <Label htmlFor="showDisclaimer">Show Disclaimer</Label>
                    </div>
                  </div>
                )}

                {config.sections.footer.enabled && (
                  <div>
                    <Label htmlFor="footerCustomText">Custom Footer Text</Label>
                    <Textarea
                      id="footerCustomText"
                      value={config.sections.footer.customText || ''}
                      onChange={(e) => updateSection('footer', 'customText', e.target.value)}
                      placeholder="Enter custom footer text"
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Section */}
            <Card>
              <CardHeader>
                <CardTitle>Summary Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="summaryEnabled"
                    checked={config.sections.summary.enabled}
                    onCheckedChange={(checked) => updateSection('summary', 'enabled', !!checked)}
                  />
                  <Label htmlFor="summaryEnabled">Enable Summary</Label>
                </div>

                {config.sections.summary.enabled && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showTotals"
                        checked={config.sections.summary.showTotals}
                        onCheckedChange={(checked) => updateSection('summary', 'showTotals', !!checked)}
                      />
                      <Label htmlFor="showTotals">Show Totals</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showAverages"
                        checked={config.sections.summary.showAverages}
                        onCheckedChange={(checked) => updateSection('summary', 'showAverages', !!checked)}
                      />
                      <Label htmlFor="showAverages">Show Averages</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showPercentages"
                        checked={config.sections.summary.showPercentages}
                        onCheckedChange={(checked) => updateSection('summary', 'showPercentages', !!checked)}
                      />
                      <Label htmlFor="showPercentages">Show Percentages</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details Section */}
            <Card>
              <CardHeader>
                <CardTitle>Details Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="detailsEnabled"
                    checked={config.sections.details.enabled}
                    onCheckedChange={(checked) => updateSection('details', 'enabled', !!checked)}
                  />
                  <Label htmlFor="detailsEnabled">Enable Details</Label>
                </div>

                {config.sections.details.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showGrid"
                        checked={config.sections.details.showGrid}
                        onCheckedChange={(checked) => updateSection('details', 'showGrid', !!checked)}
                      />
                      <Label htmlFor="showGrid">Show Grid Lines</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="alternatingRows"
                        checked={config.sections.details.alternatingRows}
                        onCheckedChange={(checked) => updateSection('details', 'alternatingRows', !!checked)}
                      />
                      <Label htmlFor="alternatingRows">Alternating Row Colors</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Filters */}
        <TabsContent value="filters">
          <Card>
            <CardHeader>
              <CardTitle>Available Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(config.filters).map(([filter, enabled]) => (
                  <div key={filter} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${filter}Filter`}
                      checked={enabled}
                      onCheckedChange={(checked) => updateFilter(filter as keyof typeof config.filters, !!checked)}
                    />
                    <Label htmlFor={`${filter}Filter`} className="capitalize">
                      {filter.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}