'use client';

import { useState } from 'react';
import { useReceivingVouchers } from '@/hooks/use-receiving-vouchers';
import { useBranch } from '@/hooks/use-branch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, Search, Package, FileText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ReceivingVouchersPage() {
  const { selectedBranch } = useBranch();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: receivingVouchers, isLoading } = useReceivingVouchers({
    branchId: selectedBranch?.id,
  });

  // Filter RVs based on search term
  const filteredRVs = receivingVouchers?.filter((rv) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      rv.rvNumber.toLowerCase().includes(searchLower) ||
      rv.PurchaseOrder.poNumber.toLowerCase().includes(searchLower) ||
      rv.PurchaseOrder.Supplier.companyName.toLowerCase().includes(searchLower)
    );
  });

  const getVarianceBadge = (variance: number) => {
    if (variance === 0) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Exact Match</Badge>;
    } else if (variance < 0) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Under-delivery</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Over-delivery</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receiving Vouchers</h1>
          <p className="text-muted-foreground">
            Track and manage purchase order receiving with variance analysis
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receiving Vouchers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receivingVouchers?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Received</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {receivingVouchers?.reduce((sum, rv) => sum + rv.ReceivingVoucherItem.length, 0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received Amount</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{receivingVouchers?.reduce((sum, rv) => sum + Number(rv.totalReceivedAmount), 0).toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by RV number, PO number, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RV Number</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Ordered Amount</TableHead>
                  <TableHead className="text-right">Received Amount</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRVs && filteredRVs.length > 0 ? (
                  filteredRVs.map((rv) => (
                    <TableRow key={rv.id}>
                      <TableCell className="font-medium">{rv.rvNumber}</TableCell>
                      <TableCell>
                        <Link
                          href={`/purchase-orders/${rv.purchaseOrderId}`}
                          className="text-primary hover:underline"
                        >
                          {rv.PurchaseOrder.poNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{rv.PurchaseOrder.Supplier.companyName}</TableCell>
                      <TableCell>{rv.Warehouse.name}</TableCell>
                      <TableCell>{rv.ReceivingVoucherItem.length}</TableCell>
                      <TableCell className="text-right">
                        ₱{Number(rv.totalOrderedAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{Number(rv.totalReceivedAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={Number(rv.varianceAmount) < 0 ? 'text-red-600' : Number(rv.varianceAmount) > 0 ? 'text-green-600' : ''}>
                            ₱{Number(rv.varianceAmount).toFixed(2)}
                          </span>
                          {getVarianceBadge(Number(rv.varianceAmount))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {rv.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(rv.receivedDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/receiving-vouchers/${rv.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      {searchTerm
                        ? 'No receiving vouchers found matching your search.'
                        : 'No receiving vouchers yet. Create one from a purchase order.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
