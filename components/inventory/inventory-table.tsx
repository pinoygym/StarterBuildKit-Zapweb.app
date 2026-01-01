'use client';

import { format } from 'date-fns';
import { MoreHorizontal, ArrowRightLeft, Edit } from 'lucide-react';
import { BatchWithRelations } from '@/types/inventory.types';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface InventoryTableProps {
  batches: BatchWithRelations[];
  onTransfer?: (batch: BatchWithRelations) => void;
  onAdjust?: (batch: BatchWithRelations) => void;
}

export function InventoryTable({ batches, onTransfer, onAdjust }: InventoryTableProps) {
  const getExpiryStatus = (expiryDate: Date) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { label: 'Expired', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' };
    } else if (daysUntilExpiry <= 30) {
      return { label: `${daysUntilExpiry}d left`, variant: 'warning' as const, className: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'Good', variant: 'default' as const, className: 'bg-green-100 text-green-800' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'depleted':
        return <Badge variant="secondary">Depleted</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Batch Number</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit Cost</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                No inventory batches found
              </TableCell>
            </TableRow>
          ) : (
            batches.map((batch) => {
              const expiryStatus = getExpiryStatus(batch.expiryDate);
              const totalValue = Number(batch.quantity) * Number(batch.unitCost);

              return (
                <TableRow
                  key={batch.id}
                  className={cn(
                    expiryStatus.variant === 'destructive' && 'bg-red-50',
                    expiryStatus.variant === 'warning' && 'bg-yellow-50'
                  )}
                >
                  <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                  <TableCell>{batch.product.name}</TableCell>
                  <TableCell>{batch.warehouse.name}</TableCell>
                  <TableCell className="text-right">
                    {Number(batch.quantity).toFixed(2)} {batch.product.baseUOM}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(batch.unitCost))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(totalValue)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">
                        {format(new Date(batch.expiryDate), 'MMM dd, yyyy')}
                      </span>
                      <Badge variant={expiryStatus.variant} className={cn('w-fit text-xs', expiryStatus.className)}>
                        {expiryStatus.label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(batch.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {onAdjust && (
                          <DropdownMenuItem onClick={() => onAdjust(batch)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Adjust Stock
                          </DropdownMenuItem>
                        )}
                        {onTransfer && (
                          <DropdownMenuItem onClick={() => onTransfer(batch)}>
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Transfer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
