'use client';

import { useState, useEffect } from 'react';
import { Search, Download, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/use-products';
import { useWarehouses } from '@/hooks/use-warehouses';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { MovementWithRelations, MovementType, ReferenceType } from '@/types/inventory.types';
import { toast } from '@/hooks/use-toast';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<MovementWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all');
  const [referenceTypeFilter, setReferenceTypeFilter] = useState<ReferenceType | 'all'>('all');

  const { products } = useProducts({ status: 'active' });
  const { warehouses } = useWarehouses();

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (productFilter !== 'all') params.append('productId', productFilter);
      if (warehouseFilter !== 'all') params.append('warehouseId', warehouseFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (referenceTypeFilter !== 'all') params.append('referenceType', referenceTypeFilter);

      const response = await fetch(`/api/inventory/movements?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setMovements(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch stock movements',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch stock movements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [productFilter, warehouseFilter, typeFilter, referenceTypeFilter]);

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'IN':
        return <Badge className="bg-green-100 text-green-800">IN</Badge>;
      case 'OUT':
        return <Badge className="bg-red-100 text-red-800">OUT</Badge>;
      case 'TRANSFER':
        return <Badge className="bg-blue-100 text-blue-800">TRANSFER</Badge>;
      case 'ADJUSTMENT':
        return <Badge className="bg-yellow-100 text-yellow-800">ADJUSTMENT</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getReferenceLink = (movement: MovementWithRelations) => {
    if (!movement.referenceId || !movement.referenceType) {
      return <span className="text-muted-foreground">-</span>;
    }

    const getLink = () => {
      switch (movement.referenceType) {
        case 'PO':
          return `/purchase-orders/${movement.referenceId}`;
        case 'SO':
          return `/sales-orders/${movement.referenceId}`;
        case 'POS':
          return `/pos/sales/${movement.referenceId}`;
        default:
          return null;
      }
    };

    const link = getLink();
    if (!link) {
      return <span>{movement.referenceType}</span>;
    }

    return (
      <a href={link} className="text-primary hover:underline">
        {movement.referenceType}-{movement.referenceId.slice(0, 8)}
      </a>
    );
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Product', 'Warehouse', 'Quantity', 'Reason', 'Reference'];
    const rows = movements.map((movement) => [
      format(new Date(movement.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      movement.type,
      movement.batch.product.name,
      movement.batch.warehouse.name,
      `${Number(movement.quantity).toFixed(2)} ${movement.batch.product.baseUOM}`,
      movement.reason || '-',
      movement.referenceType ? `${movement.referenceType}-${movement.referenceId?.slice(0, 8)}` : '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-movements-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Stock movements exported to CSV',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Stock Movements"
          description="View stock movement history"
        />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Stock Movements"
        description="Track all inventory movements including additions, deductions, and transfers"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/inventory' },
          { label: 'Movements' },
        ]}
        actions={
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as MovementType | 'all')}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="IN">IN</SelectItem>
            <SelectItem value="OUT">OUT</SelectItem>
            <SelectItem value="TRANSFER">TRANSFER</SelectItem>
            <SelectItem value="ADJUSTMENT">ADJUSTMENT</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={referenceTypeFilter}
          onValueChange={(value) => setReferenceTypeFilter(value as ReferenceType | 'all')}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Reference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All References</SelectItem>
            <SelectItem value="PO">Purchase Order</SelectItem>
            <SelectItem value="SO">Sales Order</SelectItem>
            <SelectItem value="POS">POS Sale</SelectItem>
            <SelectItem value="TRANSFER">Transfer</SelectItem>
            <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Movements Table */}
      {movements.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No movements found"
          description="Try adjusting your filters or check back later"
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {format(new Date(movement.createdAt), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{getMovementTypeBadge(movement.type)}</TableCell>
                  <TableCell>{movement.batch.product.name}</TableCell>
                  <TableCell>{movement.batch.warehouse.name}</TableCell>
                  <TableCell className="text-right">
                    {Number(movement.quantity).toFixed(2)} {movement.batch.product.baseUOM}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {movement.reason || '-'}
                  </TableCell>
                  <TableCell>{getReferenceLink(movement)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
