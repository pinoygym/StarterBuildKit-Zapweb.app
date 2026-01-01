'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Copy, Trash2, Eye } from 'lucide-react';
import { ReportTemplateConfigurator } from './report-template-configurator';
import { ReportTemplatePreview } from './report-template-preview';
import { ReportType } from '@/types/report.types';

interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  config: any;
}

const sampleTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: 'Standard Sales Report',
    type: 'SALES_SUMMARY',
    description: 'Default sales report template with company branding',
    isDefault: true,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    config: {
      companySettings: {
        name: 'InventoryPro',
        address: '123 Business St, City, Country',
        phone: '+63 123 456 7890',
        email: 'info@inventorypro.com',
      },
      styling: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: 'Inter',
        fontSize: 'medium',
      },
      sections: {
        header: { enabled: true, showLogo: true, showCompanyName: true, showAddress: true },
        footer: { enabled: true, showPageNumbers: true, showDisclaimer: true },
        summary: { enabled: true, showTotals: true, showAverages: true },
        details: { enabled: true, showGrid: true, alternatingRows: true },
      },
    },
  },
  {
    id: '2',
    name: 'Minimal POS Receipt',
    type: 'POS_RECEIPT',
    description: 'Clean and simple POS receipt template',
    isDefault: false,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    config: {
      companySettings: {
        name: 'Quick Store',
        address: 'Main Branch',
        phone: '123-4567',
      },
      styling: {
        primaryColor: '#000000',
        secondaryColor: '#666666',
        fontFamily: 'Arial',
        fontSize: 'small',
      },
      sections: {
        header: { enabled: true, showLogo: false, showCompanyName: true, showAddress: false },
        footer: { enabled: true, showPageNumbers: false, showDisclaimer: false },
        summary: { enabled: true, showTotals: true, showAverages: false },
        details: { enabled: true, showGrid: false, alternatingRows: false },
      },
    },
  },
];

export function ReportTemplateManager() {
  const [templates, setTemplates] = useState<ReportTemplate[]>(sampleTemplates);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setIsConfiguring(true);
  };

  const handleEditTemplate = (template: ReportTemplate) => {
    setEditingTemplate(template);
    setIsConfiguring(true);
  };

  const handlePreviewTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewing(true);
  };

  const handleSaveTemplate = (config: any) => {
    const newTemplate: ReportTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: config.name,
      type: config.type,
      description: config.description,
      isDefault: config.isDefault,
      isActive: config.isActive,
      createdAt: editingTemplate?.createdAt || new Date(),
      config,
    };

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? newTemplate : t));
    } else {
      setTemplates(prev => [...prev, newTemplate]);
    }

    setIsConfiguring(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const handleDuplicateTemplate = (template: ReportTemplate) => {
    const duplicatedTemplate: ReportTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      isDefault: false,
      createdAt: new Date(),
    };
    setTemplates(prev => [...prev, duplicatedTemplate]);
  };

  const getTypeLabel = (type: ReportType) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isConfiguring) {
    return (
      <ReportTemplateConfigurator
        template={editingTemplate?.config}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setIsConfiguring(false);
          setEditingTemplate(null);
        }}
        onPreview={(template) => handlePreviewTemplate({ ...editingTemplate!, config: template })}
      />
    );
  }

  if (isPreviewing && selectedTemplate) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Template Preview: {selectedTemplate.name}</h1>
          <Button variant="outline" onClick={() => setIsPreviewing(false)}>
            Back to Templates
          </Button>
        </div>
        <ReportTemplatePreview
          template={selectedTemplate.config}
          onPrint={() => console.log('Print template')}
          onExportPDF={() => console.log('Export PDF')}
          onExportExcel={() => console.log('Export Excel')}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Report Templates</h1>
        <Button onClick={handleNewTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    {template.isDefault && (
                      <Badge variant="default" className="text-xs">Default</Badge>
                    )}
                    {!template.isActive && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getTypeLabel(template.type)} • Created {template.createdAt.toLocaleDateString()}
                  </p>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Company:</span>
                  <p className="font-medium">{template.config.companySettings.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Primary Color:</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: template.config.styling.primaryColor }}
                    />
                    <span className="font-medium">{template.config.styling.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Font:</span>
                  <p className="font-medium">{template.config.styling.fontFamily}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Paper Size:</span>
                  <p className="font-medium">{template.config.styling.paperSize}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No report templates found.</p>
            <Button onClick={handleNewTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}