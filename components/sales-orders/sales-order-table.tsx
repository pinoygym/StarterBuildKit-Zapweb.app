'use client';

import { useState } from 'react';
import { MoreHorizontal, Eye, Edit, XCircle, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SalesOrderWithItems } from '@/types/sales-order.types';

interface SalesOrderTableProps {
  salesOrders: SalesOrderWithItems[];
  onEdit: (salesOrder: SalesOrderWithItems) => void;
  onCancel: (id: string) => Promise<boolean>;
  onConvertToPOS?: (salesOrder: SalesOrderWithItems) => void;
}

export function SalesOrderTable({
  salesOrders,
  onEdit,
  onCancel,
  onConvertToPOS,
}: SalesOrderTableProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleCancelClick = (id: string) => {
    setSelectedOrderId(id);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (selectedOrderId) {
      await onCancel(selectedOrderId);
      setCancelDialogOpen(false);
      setSelectedOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      pending: 'default',
      converted: 'outline',
      cancelled: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getConversionBadge = (salesOrderStatus: string) => {
    if (salesOrderStatus === 'converted') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Converted
        </Badge>
      );
    }
    return null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Customer Phone</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Conversion</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No sales orders found
                </TableCell>
              </TableRow>
            ) : (
              salesOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.customerPhone}</TableCell>
                  <TableCell>{formatCurrency(Number(order.totalAmount))}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {getConversionBadge(order.salesOrderStatus)}
                    {order.convertedToSaleId && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Sale ID: {order.convertedToSaleId.slice(0, 8)}...
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(order.deliveryDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</TableCell>
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
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {(order.status === 'draft' || order.status === 'pending') && (
                          <DropdownMenuItem onClick={() => onEdit(order)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {order.status === 'pending' &&
                          order.salesOrderStatus === 'pending' &&
                          onConvertToPOS && (
                            <DropdownMenuItem onClick={() => onConvertToPOS(order)}>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Convert to POS
                            </DropdownMenuItem>
                          )}
                        {order.status !== 'cancelled' &&
                          order.salesOrderStatus !== 'converted' && (
                            <DropdownMenuItem
                              onClick={() => handleCancelClick(order.id)}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Sales Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this sales order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm}>
              Yes, cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
