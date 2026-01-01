'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Loader2, Trash2, Database, AlertTriangle, BarChart3 } from 'lucide-react';
import { DatabaseStats } from '@/types/settings.types';

export default function SettingsPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

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
