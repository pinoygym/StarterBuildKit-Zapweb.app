'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
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
import { Loader2, Trash2, Database, AlertTriangle, BarChart3, Settings as SettingsIcon, Save, Shield, TestTube, RefreshCw, Play } from 'lucide-react';
import { DatabaseStats } from '@/types/settings.types';
import { BackupRestoreCard } from '@/components/settings/backup-restore-card';
import { useAuth } from '@/contexts/auth.context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DELETABLE_TABLES = [
  'Product', 'ProductUOM', 'Inventory', 'StockMovement', 'Customer', 'Supplier',
  'Warehouse', 'Branch', 'PurchaseOrder', 'PurchaseOrderItem', 'ReceivingVoucher',
  'ReceivingVoucherItem', 'SalesOrder', 'SalesOrderItem', 'POSSale', 'POSSaleItem',
  'POSReceipt', 'AccountsPayable', 'APPayment', 'AccountsReceivable', 'ARPayment',
  'Expense', 'CustomerPurchaseHistory', 'DailySalesSummary', 'EmployeePerformance',
  'PromotionUsage', 'AuditLog',
];

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
  const { user, isSuperMegaAdmin } = useAuth();

  const [isClearing, setIsClearing] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);

  // Admin Testing Tools State
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isDeletingTable, setIsDeletingTable] = useState(false);
  const [isDeletingTransactions, setIsDeletingTransactions] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCleaningCustomers, setIsCleaningCustomers] = useState(false);
  const [isRunningSelenium, setIsRunningSelenium] = useState(false);
  const [seleniumOutput, setSeleniumOutput] = useState<string | null>(null);
  const [isRunningEthel, setIsRunningEthel] = useState(false);
  const [ethelOutput, setEthelOutput] = useState<string | null>(null);

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

  const handleDeleteTable = async () => {
    if (!selectedTable) return;

    setIsDeletingTable(true);
    try {
      const response = await fetch('/api/settings/database/delete-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName: selectedTable }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Table Data Deleted',
          description: data.data.message,
        });
        loadDatabaseStats();
        setSelectedTable('');
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete table data',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete table data',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingTable(false);
    }
  };

  const handleSeedTestData = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch('/api/settings/database/seed-test', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Test Data Seeded',
          description: 'Successfully populated database with test data',
        });
        loadDatabaseStats();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to seed test data',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to seed test data',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteTransactions = async () => {
    setIsDeletingTransactions(true);
    try {
      const response = await fetch('/api/settings/database/delete-all-transactions', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Transactions Deleted',
          description: data.data.message,
        });
        loadDatabaseStats();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete transactions',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete transactions',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingTransactions(false);
    }
  };

  const handleCleanupTestCustomers = async () => {
    setIsCleaningCustomers(true);
    try {
      const response = await fetch('/api/settings/database/cleanup-test-customers', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Test Customers Cleaned',
          description: data.data.message,
        });
        loadDatabaseStats();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to clean up test customers',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clean up test customers',
        variant: 'destructive',
      });
    } finally {
      setIsCleaningCustomers(false);
    }
  };

  const handleRunSeleniumTests = async () => {
    setIsRunningSelenium(true);
    setSeleniumOutput(null);
    try {
      toast({
        title: 'Running Selenium Tests',
        description: 'System Health Check (CRUD) is running. This may take a few minutes...',
      });

      const response = await fetch('/api/settings/run-selenium-tests', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.data?.output) {
        setSeleniumOutput(data.data.output);
      } else if (data.data?.errors) {
        setSeleniumOutput(data.data.errors);
      }

      if (data.success) {
        toast({
          title: 'Health Check Completed',
          description: data.data.message || 'All systems operational.',
        });
      } else {
        toast({
          title: 'Health Check Failed',
          description: data.error || 'Some tests failed. Review the logs.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to run Selenium tests',
        variant: 'destructive',
      });
      setSeleniumOutput(error.message);
    } finally {
      setIsRunningSelenium(false);
    }
  };

  const handleRunEthelTests = async () => {
    setIsRunningEthel(true);
    setEthelOutput(null);
    try {
      toast({
        title: 'Running Ethel Suite',
        description: 'Comprehensive Test Suite is running. This may take up to 5 minutes...',
      });

      const response = await fetch('/api/settings/run-ethel-tests', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.data?.output) {
        setEthelOutput(data.data.output);
      } else if (data.data?.errors) {
        setEthelOutput(data.data.errors);
      }

      if (data.success) {
        toast({
          title: 'Test Suite Completed',
          description: data.data.message || 'All tests passed.',
        });
      } else {
        toast({
          title: 'Test Suite Failed',
          description: data.error || 'Some tests failed. Review the logs.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to run Ethel tests',
        variant: 'destructive',
      });
      setEthelOutput(error.message);
    } finally {
      setIsRunningEthel(false);
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
                          <NumberInput
                            id="vatRate"
                            min={0}
                            max={100}
                            step={0.01}
                            value={settings.vatRate}
                            onChange={(value) => setSettings({ ...settings, vatRate: value || 0 })}
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
                      <NumberInput
                        id="maxDiscountPercentage"
                        min={0}
                        max={100}
                        step={0.01}
                        value={settings.maxDiscountPercentage}
                        onChange={(value) => setSettings({ ...settings, maxDiscountPercentage: value || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum percentage discount allowed on sales
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discountApprovalThreshold">Approval Threshold (%)</Label>
                      <NumberInput
                        id="discountApprovalThreshold"
                        min={0}
                        max={100}
                        step={0.01}
                        value={settings.discountApprovalThreshold}
                        onChange={(value) => setSettings({ ...settings, discountApprovalThreshold: value || 0 })}
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

      {/* Backup & Restore Section */}
      <BackupRestoreCard />

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
                          className={`flex justify-between items-center p-3 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
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
          {isSuperMegaAdmin() && (
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
                    <AlertDialogDescription asChild>
                      <div className="text-sm text-muted-foreground">
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
                      </div>
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
          )}
        </CardContent>
      </Card>

      {/* Admin Testing Tools Section - Only visible to Super Mega Admin */}
      {isSuperMegaAdmin() && (
        <Card className="border-orange-500 shadow-lg bg-orange-50/10 dark:bg-orange-950/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Shield className="h-5 w-5" />
                Admin Testing Tools
              </CardTitle>
              <div className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-bold rounded-full border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                SUPER MEGA ADMIN ONLY
              </div>
            </div>
            <CardDescription>
              Advanced tools for testing and data management. Use with extreme caution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delete Specific Table Data */}
              <div className="space-y-4 p-4 border rounded-lg bg-background">
                <h3 className="font-semibold flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  Delete Specific Table Data
                </h3>
                <div className="space-y-2">
                  <Label>Select Table to Clear</Label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DELETABLE_TABLES.map((table) => (
                        <SelectItem key={table} value={table}>
                          {table}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This will delete ALL records from the selected table only.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={!selectedTable || isDeletingTable}
                    >
                      {isDeletingTable && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete {selectedTable} Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Table Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete all records from <strong>{selectedTable}</strong>?
                        <br /><br />
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteTable} className="bg-destructive text-destructive-foreground">
                        Yes, Delete Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Delete All Transactions */}
              <div className="space-y-4 p-4 border rounded-lg bg-background">
                <h3 className="font-semibold flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-orange-500" />
                  Delete All Transactions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Delete all transactional data (Sales, Purchases, Inventory, Financials) but keep master data.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={isDeletingTransactions}
                    >
                      {isDeletingTransactions ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Transactions
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Transactions?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete:
                        <ul className="list-disc pl-6 mt-2 space-y-1 mb-2">
                          <li>All Sales & POS data</li>
                          <li>All Purchase Orders & Receiving Vouchers</li>
                          <li>All Inventory Movements & Stock Levels</li>
                          <li>All Financial Records (AR, AP, Expenses)</li>
                        </ul>
                        <strong>Master data (Products, Customers, Suppliers, Users) will be PRESERVED.</strong>
                        <br /><br />
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteTransactions}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Yes, Delete Transactions
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Seed Test Data */}
              <div className="space-y-4 p-4 border rounded-lg bg-background">
                <h3 className="font-semibold flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-blue-500" />
                  Seed Test Data
                </h3>
                <p className="text-sm text-muted-foreground">
                  Populate the database with sample data for testing purposes. This includes:
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Test Branch & Warehouse</li>
                  <li>Sample Products & Inventory</li>
                  <li>Test Customers & Suppliers</li>
                  <li>Sample Transactions (PO, SO)</li>
                </ul>
                <Button
                  onClick={handleSeedTestData}
                  disabled={isSeeding}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSeeding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Seeding Data...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate Test Data
                    </>
                  )}
                </Button>
              </div>

              {/* Clean Up Test Customers */}
              <div className="space-y-4 p-4 border rounded-lg bg-background">
                <h3 className="font-semibold flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  Clean Up Test Customers
                </h3>
                <p className="text-sm text-muted-foreground">
                  Delete all customers named "Test Customer" and their related data (Sales Orders, AR, etc.).
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={isCleaningCustomers}
                    >
                      {isCleaningCustomers ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cleaning...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clean Up Test Customers
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clean Up Test Customers?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete:
                        <ul className="list-disc pl-6 mt-2 space-y-1 mb-2">
                          <li>Customers named "Test Customer"</li>
                          <li>Related Sales Orders & Items</li>
                          <li>Related Accounts Receivable records</li>
                        </ul>
                        <strong>POS Receipts and Promotion Usage will be unlinked but preserved.</strong>
                        <br /><br />
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCleanupTestCustomers}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, Clean Up
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Run Selenium Tests */}
              <div className="space-y-4 p-4 border rounded-lg bg-background">
                <h3 className="font-semibold flex items-center gap-2">
                  <Play className="h-4 w-4 text-green-500" />
                  System Health Check (Selenium)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Run comprehensive E2E CRUD tests using Selenium WebDriver. Verifies:
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>User Authentication & Management</li>
                  <li>Product Inventory Operations</li>
                  <li>Sales Order Processing</li>
                  <li>Inventory Visibility</li>
                </ul>
                <Button
                  onClick={handleRunSeleniumTests}
                  disabled={isRunningSelenium}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isRunningSelenium ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Diagnostics...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Health Check
                    </>
                  )}
                </Button>

                {seleniumOutput && (
                  <div className="mt-4">
                    <Label>Test Output Logs</Label>
                    <div className="bg-black text-green-400 p-3 rounded-md text-xs font-mono h-64 overflow-y-auto whitespace-pre-wrap mt-2 border border-green-900">
                      {seleniumOutput}
                    </div>
                  </div>
                )}
              </div>

              {/* Run Ethel Tests */}
              <div className="space-y-4 p-4 border rounded-lg bg-background">
                <h3 className="font-semibold flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-purple-500" />
                  Ethel.8-v.cc Test Suite
                </h3>
                <p className="text-sm text-muted-foreground">
                  Run comprehensive validation for Ethel.8-v.cc functionality (Login, PO, POS, Mobile).
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Full PO Workflow & Inventory Check</li>
                  <li>POS Checkout & Payment</li>
                  <li>Mobile Responsive Design Verification</li>
                  <li>Global Search & User Profile</li>
                </ul>
                <Button
                  onClick={handleRunEthelTests}
                  disabled={isRunningEthel}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isRunningEthel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Test Suite...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Ethel Suite
                    </>
                  )}
                </Button>

                {ethelOutput && (
                  <div className="mt-4">
                    <Label>Test Output Logs</Label>
                    <div className="bg-black text-purple-400 p-3 rounded-md text-xs font-mono h-64 overflow-y-auto whitespace-pre-wrap mt-2 border border-purple-900">
                      {ethelOutput}
                    </div>
                  </div>
                )}
              </div>

              {/* Compare Neon DB Schemas - Only for cybergada@gmail.com */}
              {user?.email === 'cybergada@gmail.com' && (
                <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-300 dark:border-cyan-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Database className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      Compare Neon DB Schemas
                    </h3>
                    <div className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 text-xs font-bold rounded-full border border-cyan-200 dark:border-cyan-800">
                      CYBERGADA ONLY
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Compare schema between Development and Production Neon database branches.
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Development: ep-noisy-mountain-a18wvzwi</li>
                    <li>Production: ep-blue-mouse-a128nyc9</li>
                    <li>Validates tables, columns, indexes, and foreign keys</li>
                    <li>Generates detailed JSON report</li>
                  </ul>
                  <Button
                    onClick={() => {
                      toast({
                        title: 'Schema Comparison',
                        description: 'Running comparison script... Check the report file when complete.',
                      });
                      // This would trigger the comparison script
                      fetch('/api/settings/compare-neon-schemas', {
                        method: 'POST',
                      })
                        .then(res => res.json())
                        .then(data => {
                          if (data.success) {
                            toast({
                              title: 'Comparison Complete',
                              description: data.data.message || 'Schema comparison completed successfully.',
                            });
                          } else {
                            toast({
                              title: 'Comparison Failed',
                              description: data.error || 'Failed to compare schemas.',
                              variant: 'destructive',
                            });
                          }
                        })
                        .catch(error => {
                          toast({
                            title: 'Error',
                            description: error.message || 'Failed to run comparison.',
                            variant: 'destructive',
                          });
                        });
                    }}
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Compare DB Schemas
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
