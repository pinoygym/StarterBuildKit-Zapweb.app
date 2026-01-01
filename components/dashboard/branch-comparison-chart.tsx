'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BranchData {
  branchId: string;
  branchName: string;
  revenue: string;
  expenses: string;
  profit: string;
  inventoryValue: string;
}

export function BranchComparisonChart() {
  const [data, setData] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranchComparison();
  }, []);

  const fetchBranchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard/branch-comparison');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load branch comparison');
      }
    } catch (err) {
      setError('Failed to load branch comparison');
      console.error('Error fetching branch comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const chartData = data.map((branch) => ({
    name: branch.branchName,
    Revenue: parseFloat(branch.revenue),
    Expenses: parseFloat(branch.expenses),
    Profit: parseFloat(branch.profit),
  }));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Branch Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Branch Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No branch data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Branch Performance Comparison
        </CardTitle>
        <CardDescription>
          Revenue, expenses, and profit comparison across all branches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-sm"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-sm"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Summary Table */}
        <div className="mt-6 border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Branch</th>
                <th className="text-right p-3 text-sm font-medium">Revenue</th>
                <th className="text-right p-3 text-sm font-medium">Expenses</th>
                <th className="text-right p-3 text-sm font-medium">Profit</th>
                <th className="text-right p-3 text-sm font-medium">Inventory</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((branch) => (
                <tr key={branch.branchId} className="hover:bg-muted/50">
                  <td className="p-3 font-medium">{branch.branchName}</td>
                  <td className="p-3 text-right text-green-600 dark:text-green-400 font-medium">
                    {formatCurrency(branch.revenue)}
                  </td>
                  <td className="p-3 text-right text-red-600 dark:text-red-400 font-medium">
                    {formatCurrency(branch.expenses)}
                  </td>
                  <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-medium">
                    {formatCurrency(branch.profit)}
                  </td>
                  <td className="p-3 text-right text-muted-foreground">
                    {formatCurrency(branch.inventoryValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
