'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface TopProductsChartProps {
  branchId?: string;
  limit?: number;
}

interface ProductData {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: string;
}

export function TopProductsChart({ branchId, limit = 5 }: TopProductsChartProps) {
  const [data, setData] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (branchId) params.append('branchId', branchId);
        params.append('limit', limit.toString());

        const response = await fetch(`/api/dashboard/top-products?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching top products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [branchId, limit]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
        <CardDescription>Best performing products by revenue</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No product sales data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="productName"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ value: 'Revenue (PHP)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: any) => formatCurrency(Number(value))}
                labelFormatter={(label) => `Product: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="revenue"
                fill="#8884d8"
                name="Revenue"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
