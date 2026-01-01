'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2, Database, AlertTriangle, BarChart3, Settings as SettingsIcon, Save } from 'lucide-react';
import { DatabaseStats } from '@/types/settings.types';

interface CompanySettings {
  id: string;
  companyName: string;
  address: string;
  vatEnabled: boolean;
  vatRate: number;
  vatRegistrationNumber: string;
  taxInclusive: boolean;
  maxDiscountPercentage: number;
  requireDiscountApproval: boolean;
  discountApprovalThreshold: number;
}

export default function SettingsPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);

  // Company Settings State
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  const handleClearDatabase = async () => {
    setIsClearing(true);

    try {
      const response = await fetch('/api/settings/database/clear', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Database Cleared',
          description: data.data.message,
        });

        // Refresh stats after clearing
        loadDatabaseStats();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to clear database',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear database',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const loadDatabaseStats = async () => {
    setIsLoadingStats(true);

    try {
      const response = await fetch('/api/settings/database/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load database statistics',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load database statistics',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadCompanySettings = async () => {
    setIsLoadingSettings(true);

    try {
      const response = await fetch('/api/settings/company');
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load company settings',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load company settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setIsSavingSettings(true);

    try {
      const response = await fetch(`/api/settings/company/${settings.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        toast({
          title: 'Settings Saved',
          description: 'Company settings have been updated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save company settings',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save company settings',
        variant: 'destructive',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    loadCompanySettings();
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Company Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Company Settings
          </CardTitle>
          <CardDescription>
            Configure company information, tax settings, and discount policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : settings ? (
            <div className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* VAT Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Tax Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="vatEnabled">Enable VAT</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable Value Added Tax on all sales transactions
                      </p>
                    </div>
                    <Switch
                      id="vatEnabled"
                      checked={settings.vatEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, vatEnabled: checked })}
                    />
                  </div>

                  {settings.vatEnabled && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vatRate">VAT Rate (%)</Label>
                          <Input
                            id="vatRate"
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={settings.vatRate}
                            onChange={(e) => setSettings({ ...settings, vatRate: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vatRegistrationNumber">VAT Registration Number</Label>
                          <Input
                            id="vatRegistrationNumber"
                            value={settings.vatRegistrationNumber || ''}
                            onChange={(e) => setSettings({ ...settings, vatRegistrationNumber: e.target.value })}
                            placeholder="000-000-000-000"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="taxInclusive">Tax Inclusive Pricing</Label>
                          <p className="text-sm text-muted-foreground">
                            When enabled, prices include VAT. When disabled, VAT is added on top.
                          </p>
                        </div>
                        <Switch
                          id="taxInclusive"
                          checked={settings.taxInclusive}
                          onCheckedChange={(checked) => setSettings({ ...settings, taxInclusive: checked })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Discount Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Discount Policies</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxDiscountPercentage">Maximum Discount (%)</Label>
                      <Input
                        id="maxDiscountPercentage"
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={settings.maxDiscountPercentage}
                        onChange={(e) => setSettings({ ...settings, maxDiscountPercentage: parseFloat(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum percentage discount allowed on sales
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discountApprovalThreshold">Approval Threshold (%)</Label>
                      <Input
                        id="discountApprovalThreshold"
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={settings.discountApprovalThreshold}
                        onChange={(e) => setSettings({ ...settings, discountApprovalThreshold: parseFloat(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Discounts above this threshold require approval
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="requireDiscountApproval">Require Discount Approval</Label>
                      <p className="text-sm text-muted-foreground">
                        Require manager approval for discounts exceeding threshold
                      </p>
                    </div>
                    <Switch
                      id="requireDiscountApproval"
                      checked={settings.requireDiscountApproval}
                      onCheckedChange={(checked) => setSettings({ ...settings, requireDiscountApproval: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  size="lg"
                >
                  {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Failed to load company settings
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Management
          </CardTitle>
          <CardDescription>
            Manage your database data and view statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Database Statistics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Database Statistics
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDatabaseStats}
                disabled={isLoadingStats}
              >
                {isLoadingStats && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Refresh
              </Button>
            </div>

            {stats && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Tables</CardDescription>
                      <CardTitle className="text-2xl">{stats.totalTables}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Records</CardDescription>
                      <CardTitle className="text-2xl">{stats.totalRecords.toLocaleString()}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Non-Empty Tables</CardDescription>
                      <CardTitle className="text-2xl">
                        {stats.tableStats.filter(t => t.recordCount > 0).length}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {/* Table Details */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-3 font-semibold">
                    Tables with Data
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {stats.tableStats
                      .filter(t => t.recordCount > 0)
                      .map((table, index) => (
                        <div
                          key={table.tableName}
                          className={`flex justify-between items-center p-3 ${
                            index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                          }`}
                        >
                          <span className="font-medium">{table.tableName}</span>
                          <span className="text-sm text-muted-foreground">
                            {table.recordCount.toLocaleString()} records
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clear Database Section */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </h3>

            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This action will permanently delete all transactional
                and master data from your Neon PostgreSQL database. User accounts and roles
                will be preserved. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isClearing}>
                  {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all data from the following categories:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>All transactions (sales, purchases, POS)</li>
                      <li>All inventory batches and movements</li>
                      <li>All financial records (AR, AP, expenses)</li>
                      <li>All master data (products, customers, suppliers, warehouses)</li>
                    </ul>
                    <p className="mt-4 font-semibold text-destructive">
                      This action cannot be undone!
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearDatabase}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Clear All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
