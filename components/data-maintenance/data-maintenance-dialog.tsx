'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ReferenceDataType, ReferenceDataConfig, ReferenceDataBase } from '@/types/data-maintenance.types';

interface DataMaintenanceDialogProps<T extends ReferenceDataBase> {
  open: boolean;
  onClose: () => void;
  config: ReferenceDataConfig;
  item?: T | null;
  onSuccess: () => void;
}

export function DataMaintenanceDialog<T extends ReferenceDataBase>({
  open,
  onClose,
  config,
  item,
  onSuccess,
}: DataMaintenanceDialogProps<T>) {
  const isEditing = !!item;
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      // Initialize with defaults
      const defaults: any = { status: 'active' };
      if (config.hasApplicableTo) {
        defaults.applicableTo = ['expense', 'pos', 'ar', 'ap'];
      }
      setFormData(defaults);
    }
  }, [item, open, config]);

  const handleClose = () => {
    if (!submitting) {
      setFormData({});
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = isEditing
        ? `/api/data-maintenance/${config.type}/${item.id}`
        : `/api/data-maintenance/${config.type}`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Operation failed');
      }

      toast.success(isEditing ? `${config.singularTitle} updated successfully` : `${config.singularTitle} created successfully`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              placeholder={field.placeholder}
              required={field.required}
              rows={3}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={formData[field.name] || ''}
              onValueChange={(value) => setFormData({ ...formData, [field.name]: value })}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.name} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="space-y-2">
              {field.options?.map((option: any) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.name}-${option.value}`}
                    checked={(formData[field.name] || []).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const current = formData[field.name] || [];
                      const updated = checked
                        ? [...current, option.value]
                        : current.filter((v: string) => v !== option.value);
                      setFormData({ ...formData, [field.name]: updated });
                    }}
                  />
                  <label
                    htmlFor={`${field.name}-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.name]: parseFloat(e.target.value) || 0 })}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit ${config.singularTitle}` : `Add New ${config.singularTitle}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the ${config.singularTitle.toLowerCase()} details` : `Create a new ${config.singularTitle.toLowerCase()}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {config.fields.map(renderField)}

          {!config.hasVendorFields && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'active'}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
