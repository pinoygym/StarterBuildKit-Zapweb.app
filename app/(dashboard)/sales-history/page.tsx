'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Download, Eye, TrendingUp, DollarSign, ShoppingCart, CreditCard, Search, Filter, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DateRangeFilter } from '@/components/sales-history/date-range-filter';
import { SaleDetailModal } from '@/components/sales-history/sale-detail-modal';
import { DatePreset, SalesHistoryFilters, SalesHistoryResponse, SalesAnalytics } from '@/types/sales-history.types';
import { POSSaleWithItems } from '@/types/pos.types';
import { useBranchContext } from '@/contexts/branch-context';

export default function SalesHistoryPage() {
  const { selectedBranch } = useBranchContext();
  const [filters, setFilters] = useState<SalesHistoryFilters>({
    preset: DatePreset.TODAY,
    page: 1,
    limit: 50,
  });
  const [salesData, setSalesData] = useState<SalesHistoryResponse | null>(null);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<POSSaleWithItems | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Additional filter states
  const [receiptSearch, setReceiptSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  useEffect(() => {
    fetchSalesHistory();
    fetchAnalytics();
  }, [filters]);

  const fetchSalesHistory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.preset) params.append('preset', filters.preset);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.receiptNumber) params.append('receiptNumber', filters.receiptNumber);
      if (filters.minAmount) params.append('minAmount', filters.minAmount.toString());
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/sales-history?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSalesData(data.data);
      }
    } catch (error) {
      console.error('Error fetching sales history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.preset) params.append('preset', filters.preset);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/sales-history/analytics?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleDateFilterChange = (preset: DatePreset, startDate?: Date, endDate?: Date) => {
    setFilters({
      ...filters,
      preset,
      startDate,
      endDate,
      page: 1, // Reset to first page
    });
  };

  const handleApplyFilters = () => {
    setFilters({
      ...filters,
      receiptNumber: receiptSearch || undefined,
      paymentMethod: paymentMethodFilter && paymentMethodFilter !== 'all' ? paymentMethodFilter as any : undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      branchId: selectedBranch?.id,
      page: 1, // Reset to first page
    });
  };

  const handleClearFilters = () => {
    setReceiptSearch('');
    setPaymentMethodFilter('');
    setMinAmount('');
    setMaxAmount('');
    setFilters({
      preset: DatePreset.TODAY,
      page: 1,
      limit: 50,
    });
  };

  const handleViewSale = (sale: POSSaleWithItems) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants: { [key: string]: any } = {
      cash: 'default',
      credit: 'secondary',
      ar_credit: 'outline',
    };
    return <Badge variant={variants[method] || 'default'}>{method.toUpperCase()}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales History</h1>
          <p className="text-muted-foreground">Monitor and analyze all sales transactions</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.totalSales)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalTransactions} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
              <Tag className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(analytics.totalDiscount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Customer savings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics.averageTransactionValue)}
              </div>
              <p className="text-xs text-muted-foreground">Per sale</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics.paymentMethodBreakdown.cash.amount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.paymentMethodBreakdown.cash.count} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credit Sales</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  analytics.paymentMethodBreakdown.credit.amount +
                    analytics.paymentMethodBreakdown.ar_credit.amount
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.paymentMethodBreakdown.credit.count +
                  analytics.paymentMethodBreakdown.ar_credit.count}{' '}
                transactions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Filters Sidebar */}
        <div className="space-y-4">
          <DateRangeFilter
            onFilterChange={handleDateFilterChange}
            defaultPreset={filters.preset}
          />

          {/* Additional Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Additional Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Receipt Number Search */}
              <div className="space-y-2">
                <Label htmlFor="receiptSearch">Receipt Number</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="receiptSearch"
                    placeholder="Search receipt..."
                    value={receiptSearch}
                    onChange={(e) => setReceiptSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Payment Method Filter */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="ar_credit">AR Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label>Amount Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button onClick={handleApplyFilters} className="w-full">
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {salesData && `Showing ${salesData.sales.length} of ${salesData.pagination.total} transactions`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : salesData && salesData.sales.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.sales.map((sale: POSSaleWithItems) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.receiptNumber}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{format(new Date(sale.createdAt), 'MMM dd, yyyy')}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(sale.createdAt), 'hh:mm a')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">Walk-in</span>
                        </TableCell>
                        <TableCell>{getPaymentMethodBadge(sale.paymentMethod)}</TableCell>
                        <TableCell className="text-right">
                          {sale.discount > 0 ? (
                            <div className="flex flex-col">
                              <span className="text-green-600 font-medium">
                                {formatCurrency(Number(sale.discount))}
                              </span>
                              {sale.discountType === 'percentage' && sale.discountValue && (
                                <span className="text-xs text-muted-foreground">
                                  ({sale.discountValue}%)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(sale.totalAmount))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSale(sale)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {salesData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {salesData.pagination.page} of {salesData.pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={salesData.pagination.page === 1}
                        onClick={() =>
                          setFilters({ ...filters, page: salesData.pagination.page - 1 })
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          salesData.pagination.page === salesData.pagination.totalPages
                        }
                        onClick={() =>
                          setFilters({ ...filters, page: salesData.pagination.page + 1 })
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No sales found for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sale Detail Modal */}
      <SaleDetailModal
        sale={selectedSale}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </div>
  );
}
