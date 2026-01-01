'use client';

import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/shared/empty-state';
import { CartItem } from '@/app/(dashboard)/pos/page';

interface POSCartProps {
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onUpdateUOM: (index: number, uom: string) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function POSCart({
  items,
  onUpdateQuantity,
  onUpdateUOM,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: POSCartProps) {
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.12; // 12% VAT
  const total = subtotal + tax;

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
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {items.map((item, index) => (
            <div key={index} className="space-y-2 pb-3 border-b last:border-0">
              {/* Product Name */}
              <div className="flex items-start justify-between">
                <span className="font-medium text-sm">{item.productName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(index)}
                  className="h-6 w-6 p-0"
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
                      {uom.name} - ₱{uom.sellingPrice.toFixed(2)}
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
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (Number.isNaN(value)) return;
                      onUpdateQuantity(index, Math.max(1, value));
                    }}
                    className="w-12 h-8 text-center px-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Subtotal */}
                <span className="font-semibold">₱{item.subtotal.toFixed(2)}</span>
              </div>

              {/* Unit Price */}
              <div className="text-xs text-muted-foreground">
                ₱{item.unitPrice.toFixed(2)} × {item.quantity}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (12%)</span>
            <span>₱{tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">₱{total.toFixed(2)}</span>
          </div>
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
