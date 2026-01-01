'use client';

import { Minus, Plus, Trash2, ShoppingCart, Percent, DollarSign } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { CartItem } from '@/app/(dashboard)/pos/page';
import { formatCurrency, formatQuantity } from '@/lib/utils';

interface POSCartProps {
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onUpdateUOM: (index: number, uom: string) => void;
  onItemDiscount: (index: number, discountType: 'percentage' | 'fixed', discountValue: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function POSCart({
  items,
  onUpdateQuantity,
  onUpdateUOM,
  onItemDiscount,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: POSCartProps) {
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
  const total = subtotal;

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shopping Cart</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={ShoppingCart}
            title="Cart is empty"
            description="Add products to get started"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Shopping Cart ({items.length})</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClearCart}>
          Clear
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cart Items */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {items.map((item, index) => (
            <div key={index} data-testid="cart-item" className="space-y-2 pb-3 border-b last:border-0">
              {/* Product Name */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="font-medium text-sm">{item.productName}</span>
                  {item.discount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {item.discountType === 'percentage'
                        ? `-${item.discountValue}%`
                        : `-${formatCurrency(item.discountValue || 0)}`}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(index)}
                  className="h-6 w-6 p-0"
                  data-testid="remove-from-cart"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              {/* UOM Selection */}
              <Select
                value={item.uom}
                onValueChange={(value) => onUpdateUOM(index, value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {item.availableUOMs.map((uom) => (
                    <SelectItem key={uom.name} value={uom.name}>
                      {uom.name} - {formatCurrency(uom.sellingPrice)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    className="h-8 w-8 p-0"
                    data-testid="decrease-quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <NumberInput
                    min={1}
                    value={item.quantity}
                    onChange={(value) => {
                      onUpdateQuantity(index, Math.max(1, value || 1));
                    }}
                    className="w-12 h-8 text-center px-1"
                    data-testid="quantity-input"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    className="h-8 w-8 p-0"
                    data-testid="increase-quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  {item.discount > 0 && (
                    <div className="text-xs text-muted-foreground line-through">
                      {formatCurrency(item.originalPrice * item.quantity)}
                    </div>
                  )}
                  <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                </div>
              </div>

              {/* Discount Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={item.discountType || 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        onItemDiscount(index, 'percentage', 0);
                      } else {
                        const currentValue = item.discountValue || 0;
                        onItemDiscount(index, value as 'percentage' | 'fixed', currentValue);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Discount</SelectItem>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          <span>Percent</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>Fixed</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {item.discountType && (item.discountType as string) !== 'none' && (
                    <NumberInput
                      min={0}
                      step={item.discountType === 'percentage' ? 1 : 0.01}
                      max={item.discountType === 'percentage' ? 100 : item.originalPrice}
                      value={item.discountValue || 0}
                      onChange={(value) => {
                        onItemDiscount(index, item.discountType!, value || 0);
                      }}
                      placeholder={item.discountType === 'percentage' ? '0%' : '₱0.00'}
                      className="h-8 flex-1"
                    />
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div className="flex justify-between">
                    <span>Unit Price:</span>
                    <span>{formatCurrency(item.originalPrice)}</span>
                  </div>
                  {item.discount > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(item.discount)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Final Price:</span>
                        <span>{formatCurrency(item.unitPrice)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Total Savings</span>
              <span>-{formatCurrency(totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Subtotal</span>
            <span className="text-primary" data-testid="cart-total">{formatCurrency(total)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tax will be calculated at checkout based on company settings
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full" size="lg" onClick={onCheckout}>
          Proceed to Payment
        </Button>
      </CardFooter>
    </Card>
  );
}
