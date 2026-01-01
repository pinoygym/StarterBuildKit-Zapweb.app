'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface LowStockAlertsProps {
  branchId?: string;
  limit?: number;
}

interface LowStockProduct {
  productId: string;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  status: 'low' | 'critical';
}

export function LowStockAlerts({ branchId, limit = 10 }: LowStockAlertsProps) {
  const [data, setData] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (branchId) params.append('branchId', branchId);
        params.append('limit', limit.toString());

        const response = await fetch(`/api/dashboard/low-stock?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [branchId, limit]);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Low Stock Alerts</CardTitle>
        <CardDescription>Products that need restocking</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Package className="h-12 w-12 mb-2 opacity-50" />
            <p>All products are adequately stocked</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((product) => (
              <div
                key={product.productId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {product.status === 'critical' ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <div className="font-medium">{product.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      Current: {product.currentStock} | Minimum: {product.minStockLevel}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={product.status === 'critical' ? 'destructive' : 'default'}
                    className={product.status === 'critical' ? '' : 'bg-yellow-500 hover:bg-yellow-600'}
                  >
                    {product.status === 'critical' ? 'Critical' : 'Low'}
                  </Badge>
                  <div className="text-sm font-medium text-muted-foreground">
                    {((product.currentStock / product.minStockLevel) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
