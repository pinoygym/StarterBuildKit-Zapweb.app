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

      <CardContent className="space-y-3 sm:space-y-4">
        {/* Cart Items */}
        <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto mobile-scroll pr-1">
          {items.map((item, index) => (
            <div key={index} data-testid="cart-item" className="space-y-2 pb-2 sm:pb-3 border-b last:border-0 border-muted/50">
              {/* Product Name and Remove */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-xs xs:text-sm block truncate">{item.productName}</span>
                  {item.discount > 0 && (
                    <Badge variant="secondary" className="mt-0.5 text-[10px] py-0 px-1">
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
                  className="h-7 w-7 p-0 flex-shrink-0 text-destructive hover:bg-destructive/10"
                  data-testid="remove-from-cart"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* UOM and Controls row */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Select
                  value={item.uom}
                  onValueChange={(value) => onUpdateUOM(index, value)}
                >
                  <SelectTrigger className="h-7 text-[10px] xs:text-xs px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {item.availableUOMs.map((uom) => (
                      <SelectItem key={uom.name} value={uom.name} className="text-[10px] xs:text-xs">
                        {uom.name} - {formatCurrency(uom.sellingPrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    className="h-7 w-7 p-0"
                    data-testid="decrease-quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      onUpdateQuantity(index, Math.max(1, isNaN(val) ? 1 : val));
                    }}
                    className="w-8 h-7 text-center text-[10px] xs:text-xs bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-primary px-0"
                    data-testid="quantity-input"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    className="h-7 w-7 p-0"
                    data-testid="increase-quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Discount and Subtotal row */}
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
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
                    <SelectTrigger className="h-7 w-[90px] text-[10px] px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-[10px]">No Disc</SelectItem>
                      <SelectItem value="percentage" className="text-[10px]">Percent</SelectItem>
                      <SelectItem value="fixed" className="text-[10px]">Fixed</SelectItem>
                    </SelectContent>
                  </Select>

                  {item.discountType && (item.discountType as string) !== 'none' && (
                    <input
                      type="number"
                      min={0}
                      step={item.discountType === 'percentage' ? 1 : 0.01}
                      max={item.discountType === 'percentage' ? 100 : item.originalPrice}
                      value={item.discountValue || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onItemDiscount(index, item.discountType!, isNaN(val) ? 0 : val);
                      }}
                      placeholder={item.discountType === 'percentage' ? '%' : '₱'}
                      className="h-7 flex-1 min-w-[40px] text-[10px] bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-primary px-1.5"
                    />
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  {item.discount > 0 && (
                    <div className="text-[9px] text-muted-foreground line-through leading-none mb-0.5">
                      {formatCurrency(item.originalPrice * item.quantity)}
                    </div>
                  )}
                  <span className="font-bold text-xs xs:text-sm text-primary">{formatCurrency(item.subtotal)}</span>
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
