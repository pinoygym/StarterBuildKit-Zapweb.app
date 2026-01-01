'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, TrendingUp, DollarSign, Tag, Users, Calendar } from 'lucide-react';

export default function DiscountPromotionAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    branchId: '',
  });

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.branchId) params.append('branchId', filters.branchId);

      const response = await fetch(`/api/reports/discount-promotion-analytics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch promotion analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching promotion analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportToCSV = () => {
    if (!analyticsData?.promotionUsage) return;

    const csvContent = [
      ['Promotion Name', 'Customer', 'Branch', 'Original Amount', 'Discount Amount', 'Final Amount', 'Date'],
      ...analyticsData.promotionUsage.map((usage: any) => [
        usage.promotion?.name || 'N/A',
        usage.customer?.name || 'Walk-in',
        usage.branch?.name || 'N/A',
        usage.originalAmount,
        usage.discountAmount,
        usage.finalAmount,
        formatDate(usage.createdAt),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promotion-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const promotionData = analyticsData?.promotionUsage?.reduce((acc: any[], usage: any) => {
    const promoName = usage.promotion?.name || 'Unknown';
    const existing = acc.find(item => item.name === promoName);
    if (existing) {
      existing.usageCount += 1;
      existing.totalDiscount += usage.discountAmount;
      existing.totalAmount += usage.originalAmount;
    } else {
      acc.push({
        name: promoName,
        usageCount: 1,
        totalDiscount: usage.discountAmount,
        totalAmount: usage.originalAmount,
      });
    }
    return acc;
  }, []) || [];

  const dailyTrends = analyticsData?.promotionUsage?.reduce((acc: any[], usage: any) => {
    const date = new Date(usage.createdAt).toISOString().split('T')[0];
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.usageCount += 1;
      existing.totalDiscount += usage.discountAmount;
    } else {
      acc.push({
        date,
        usageCount: 1,
        totalDiscount: usage.discountAmount,
      });
    }
    return acc;
  }, []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-96 bg-gray-200 animate-pulse rounded mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 animate-pulse rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Discount & Promotion Usage Analytics</CardTitle>
              <CardDescription>
                Track and analyze discount and promotion usage across branches
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="branchId">Branch</Label>
              <Input
                id="branchId"
                type="text"
                placeholder="All branches"
                value={filters.branchId}
                onChange={(e) => handleFilterChange('branchId', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchAnalyticsData} className="w-full">
                Refresh
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Usage</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analyticsData?.summaryStats._count.id || 0}
                    </p>
                  </div>
                  <Tag className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Discount</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(analyticsData?.summaryStats._sum.discountAmount || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Discount</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(analyticsData?.summaryStats._avg.discountAmount || 0)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(analyticsData?.summaryStats._sum.finalAmount || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Promotion Usage by Type</CardTitle>
                <CardDescription>Usage count by promotion</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={promotionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usageCount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Usage Trends</CardTitle>
                <CardDescription>Promotion usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="usageCount" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promotion</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Final Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData?.promotionUsage?.map((usage: any) => (
                  <TableRow key={usage.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{usage.promotion?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">
                          {usage.promotion?.description || 'No description'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{usage.customer?.name || 'Walk-in'}</TableCell>
                    <TableCell>{usage.branch?.name || 'N/A'}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(usage.originalAmount)}
                    </TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      {formatCurrency(usage.discountAmount)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(usage.finalAmount)}
                    </TableCell>
                    <TableCell>{formatDate(usage.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}