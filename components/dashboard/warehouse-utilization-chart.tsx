'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Warehouse, AlertTriangle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface WarehouseData {
  warehouseId: string;
  warehouseName: string;
  branchId: string;
  maxCapacity: number;
  currentStock: number;
  utilizationPercentage: number;
  status: 'normal' | 'warning' | 'critical';
}

interface WarehouseUtilizationChartProps {
  branchId?: string;
}

export function WarehouseUtilizationChart({ branchId }: WarehouseUtilizationChartProps) {
  const [data, setData] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWarehouseUtilization();
  }, [branchId]);

  const fetchWarehouseUtilization = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);

      const response = await fetch(`/api/dashboard/warehouse-utilization?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load warehouse utilization');
      }
    } catch (err) {
      setError('Failed to load warehouse utilization');
      console.error('Error fetching warehouse utilization:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return (
          <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Normal
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Warning
          </Badge>
        );
      case 'critical':
        return (
          <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Warehouse Capacity Utilization
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
            <Warehouse className="h-5 w-5" />
            Warehouse Capacity Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No warehouse data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="h-5 w-5" />
          Warehouse Capacity Utilization
        </CardTitle>
        <CardDescription>
          Current stock levels and capacity usage across all warehouses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.map((warehouse) => (
          <div key={warehouse.warehouseId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{warehouse.warehouseName}</h4>
                {getStatusBadge(warehouse.status)}
              </div>
              <span className="text-sm text-muted-foreground">
                {warehouse.currentStock.toLocaleString()} / {warehouse.maxCapacity.toLocaleString()} units
              </span>
            </div>

            <div className="space-y-1">
              <Progress
                value={warehouse.utilizationPercentage}
                className="h-3"
                indicatorClassName={getStatusColor(warehouse.status)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{warehouse.utilizationPercentage.toFixed(1)}% utilized</span>
                <span>
                  {(warehouse.maxCapacity - warehouse.currentStock).toLocaleString()} units available
                </span>
              </div>
            </div>

            {warehouse.status === 'critical' && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Warehouse is at {warehouse.utilizationPercentage.toFixed(1)}% capacity. Consider restocking or expanding.
                </AlertDescription>
              </Alert>
            )}

            {warehouse.status === 'warning' && (
              <Alert className="mt-2 border-yellow-500">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-xs text-yellow-600 dark:text-yellow-400">
                  Warehouse utilization is at {warehouse.utilizationPercentage.toFixed(1)}%. Monitor stock levels.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ))}

        {/* Summary Stats */}
        <div className="pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.filter((w) => w.status === 'normal').length}
            </div>
            <div className="text-xs text-muted-foreground">Normal</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {data.filter((w) => w.status === 'warning').length}
            </div>
            <div className="text-xs text-muted-foreground">Warning</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data.filter((w) => w.status === 'critical').length}
            </div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
