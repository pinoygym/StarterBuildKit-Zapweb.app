'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ShoppingBag, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SalesOrderWithItems } from '@/types/sales-order.types';
import { toast } from '@/hooks/use-toast';

interface POSPendingOrdersProps {
  branchId?: string;
  onConvertOrder: (order: SalesOrderWithItems) => void;
}

export function POSPendingOrders({ branchId, onConvertOrder }: POSPendingOrdersProps) {
  const [orders, setOrders] = useState<SalesOrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPendingOrders();
  }, [branchId]);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const url = branchId
        ? `/api/pos/pending-orders?branchId=${branchId}`
        : '/api/pos/pending-orders';
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch pending orders',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pending orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = (order: SalesOrderWithItems) => {
    onConvertOrder(order);
    setIsOpen(false);
    setSelectedOrders(new Set());
    toast({
      title: 'Order Loaded',
      description: `Sales order ${order.orderNumber} loaded into cart`,
    });
  };

  const handleToggleOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  const handleBulkConvert = () => {
    if (selectedOrders.size === 0) {
      toast({
        title: 'No Orders Selected',
        description: 'Please select at least one order to convert',
        variant: 'destructive',
      });
      return;
    }

    // Get all selected orders
    const ordersToConvert = orders.filter(o => selectedOrders.has(o.id));

    // Merge all items from selected orders
    const mergedOrder: SalesOrderWithItems = {
      ...ordersToConvert[0],
      id: `BULK-${ordersToConvert.map(o => o.id).join(',')}`, // Store order IDs in the id field
      orderNumber: `BULK-${ordersToConvert.map(o => o.orderNumber).join(',')}`,
      items: ordersToConvert.flatMap(o => o.items),
      totalAmount: ordersToConvert.reduce((sum, o) => sum + Number(o.totalAmount), 0) as any,
    };

    onConvertOrder(mergedOrder);
    setIsOpen(false);
    setSelectedOrders(new Set());
    
    toast({
      title: 'Orders Loaded',
      description: `${selectedOrders.size} order${selectedOrders.size > 1 ? 's' : ''} loaded into cart`,
    });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading || orders.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <CardTitle className="text-base">
                  Pending Orders
                  <Badge variant="secondary" className="ml-2">
                    {orders.length}
                  </Badge>
                </CardTitle>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {/* Bulk Actions */}
            {orders.length > 1 && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedOrders.size === orders.length}
                    onCheckedChange={handleToggleAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedOrders.size > 0
                      ? `${selectedOrders.size} selected`
                      : 'Select all'}
                  </span>
                </div>
                {selectedOrders.size > 0 && (
                  <Button
                    size="sm"
                    onClick={handleBulkConvert}
                  >
                    Convert {selectedOrders.size} Order{selectedOrders.size > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            )}

            {orders.map((order) => (
              <div
                key={order.id}
                className="p-3 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
              >
                {/* Order Header with Checkbox */}
                <div className="flex items-start gap-3">
                  {orders.length > 1 && (
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={() => handleToggleOrder(order.id)}
                      className="mt-1"
                    />
                  )}
                  
                  <div className="flex-1 space-y-3">
                    {/* Order Info */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold text-sm">{order.orderNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-semibold text-primary">
                          ₱{Number(order.totalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(order.deliveryDate)}
                        </div>
                      </div>
                    </div>

                    {/* Customer Info Section */}
                    <div className="p-2 bg-muted/30 rounded space-y-1">
                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Customer Information</span>
                      </div>
                      <div className="text-sm font-medium">
                        {order.customerName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.customerPhone}
                      </div>
                      {order.customerEmail && (
                        <div className="text-xs text-muted-foreground">
                          {order.customerEmail}
                        </div>
                      )}
                      {order.deliveryAddress && (
                        <div className="text-xs text-muted-foreground">
                          {order.deliveryAddress}
                        </div>
                      )}
                    </div>

                    {/* Convert Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleConvert(order)}
                    >
                      Convert to POS
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
