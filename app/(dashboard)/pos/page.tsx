'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { POSProductGrid } from '@/components/pos/pos-product-grid';
import { POSCart } from '@/components/pos/pos-cart';
import { POSPayment } from '@/components/pos/pos-payment';
import { POSTodaySummary } from '@/components/pos/pos-today-summary';
import { POSPendingOrders } from '@/components/pos/pos-pending-orders';
import { POSReceipt } from '@/components/pos/pos-receipt';
import { useBranch } from '@/hooks/use-branch';
import { ProductWithStock } from '@/types/pos.types';
import { SalesOrderWithItems } from '@/types/sales-order.types';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  uom: string;
  originalPrice: number;
  unitPrice: number;
  discount: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  subtotal: number;
  availableStock: number;
  availableUOMs: Array<{
    name: string;
    sellingPrice: number;
  }>;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  branchId: string;
}

export default function POSPage() {
  const { selectedBranch } = useBranch();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [convertingOrder, setConvertingOrder] = useState<SalesOrderWithItems | null>(null);
  const [convertingOrderIds, setConvertingOrderIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch warehouses for the selected branch
  useEffect(() => {
    if (!selectedBranch) return;

    async function fetchWarehouses() {
      if (!selectedBranch) return;

      try {
        const response = await fetch(`/api/warehouses?branchId=${selectedBranch.id}`);
        const data = await response.json();



        if (data.success && data.data.length > 0) {
          setWarehouses(data.data);
          // Auto-select first warehouse
          setSelectedWarehouse(data.data[0].id);

        } else {

        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    }

    fetchWarehouses();
  }, [selectedBranch]);

  const handleAddToCart = (product: ProductWithStock, uom: string, quantity: number = 1) => {
    const existingItemIndex = cart.findIndex(
      (item) => item.productId === product.id && item.uom === uom
    );

    // Get the price for the selected UOM
    let unitPrice = product.basePrice;
    if (uom !== product.baseUOM) {
      const alternateUOM = product.alternateUOMs.find((u) => u.name === uom);
      unitPrice = alternateUOM?.sellingPrice || product.basePrice;
    }

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      const item = updatedCart[existingItemIndex];
      const discountedPrice = item.originalPrice - item.discount;
      updatedCart[existingItemIndex].unitPrice = discountedPrice;
      updatedCart[existingItemIndex].subtotal = item.quantity * discountedPrice;
      setCart(updatedCart);
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        quantity,
        uom,
        originalPrice: unitPrice,
        unitPrice,
        discount: 0,
        discountType: undefined,
        discountValue: undefined,
        subtotal: quantity * unitPrice,
        availableStock: product.currentStock,
        availableUOMs: [
          { name: product.baseUOM, sellingPrice: product.basePrice },
          ...product.alternateUOMs.map((u) => ({
            name: u.name,
            sellingPrice: u.sellingPrice,
          })),
        ],
      };
      setCart([...cart, newItem]);
    }
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(index);
      return;
    }

    const updatedCart = [...cart];
    updatedCart[index].quantity = quantity;
    updatedCart[index].subtotal = quantity * updatedCart[index].unitPrice;
    setCart(updatedCart);
  };

  const handleUpdateUOM = (index: number, uom: string) => {
    const updatedCart = [...cart];
    const item = updatedCart[index];

    // Find the new price for the selected UOM
    const uomOption = item.availableUOMs.find((u) => u.name === uom);
    if (uomOption) {
      item.uom = uom;
      item.unitPrice = uomOption.sellingPrice;
      item.subtotal = item.quantity * item.unitPrice;
      setCart(updatedCart);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
  };

  const handleItemDiscount = (
    index: number,
    discountType: 'percentage' | 'fixed',
    discountValue: number
  ) => {
    const updatedCart = [...cart];
    const item = updatedCart[index];

    // Calculate discount amount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = item.originalPrice * (discountValue / 100);
    } else {
      discountAmount = Math.min(discountValue, item.originalPrice);
    }

    // Update item
    item.discount = discountAmount;
    item.discountType = discountType;
    item.discountValue = discountValue;
    item.unitPrice = item.originalPrice - discountAmount;
    item.subtotal = item.quantity * item.unitPrice;

    setCart(updatedCart);
  };

  const handleClearCart = () => {
    setCart([]);
    setShowPayment(false);
    setConvertingOrder(null);
    setConvertingOrderIds([]);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowPayment(true);
  };

  const handlePaymentComplete = (sale: any) => {
    setCompletedSale(sale);
    setShowReceipt(true);
    handleClearCart();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleConvertOrder = async (order: SalesOrderWithItems) => {
    try {
      // Fetch product details to get available UOMs and stock
      const productIds = [...new Set(order.items.map(item => item.productId))];
      const productsResponse = await fetch(`/api/pos/products?warehouseId=${selectedWarehouse}`);
      const productsData = await productsResponse.json();

      if (!productsData.success) {
        toast({
          title: 'Error',
          description: 'Failed to load product details',
          variant: 'destructive',
        });
        return;
      }

      const productsMap = new Map<string, ProductWithStock>(
        productsData.data.map((p: ProductWithStock) => [p.id, p])
      );

      // Pre-populate cart with order items
      const cartItems: CartItem[] = order.items.map((item) => {
        const product = productsMap.get(item.productId);

        return {
          productId: item.productId,
          productName: item.product?.name || 'Unknown Product',
          quantity: Number(item.quantity),
          uom: item.uom,
          unitPrice: Number(item.unitPrice),
          originalPrice: Number(item.unitPrice), // Assuming original price is same as unit price for converted order
          discount: 0,
          subtotal: Number(item.subtotal),
          availableStock: product?.currentStock ?? 0,
          availableUOMs: product ? [
            { name: product.baseUOM, sellingPrice: Number(product.basePrice) },
            ...product.alternateUOMs.map((u) => ({
              name: u.name,
              sellingPrice: Number(u.sellingPrice),
            })),
          ] : [],
        };
      });

      setCart(cartItems);
      setConvertingOrder(order);

      // Check if this is a bulk conversion (order number starts with BULK-)
      if (order.orderNumber.startsWith('BULK-')) {
        // Extract order IDs from the special 'id' field which contains comma-separated IDs
        const ids = order.id.replace('BULK-', '').split(',');
        setConvertingOrderIds(ids);
      } else {
        // Single order conversion
        setConvertingOrderIds([order.id]);
      }

      toast({
        title: 'Order Loaded',
        description: `${order.items.length} item${order.items.length > 1 ? 's' : ''} added to cart`,
      });
    } catch (error) {
      console.error('Error converting order:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert order',
        variant: 'destructive',
      });
    }
  };

  const handleNewSale = () => {
    setShowReceipt(false);
    setCompletedSale(null);
  };

  // Show message if no branch selected
  if (!selectedBranch) {
    return (
      <div className="p-6">
        <PageHeader
          title="Point of Sale"
          description="Process sales transactions"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'POS' },
          ]}
        />
        <Card className="mt-6">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">
              Please select a branch to start using the POS system
            </p>
            <p className="text-sm text-muted-foreground">
              You can select a branch from the branch selector in the navigation bar
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message if no warehouses available
  if (warehouses.length === 0) {
    return (
      <div className="p-6">
        <PageHeader
          title="Point of Sale"
          description="Process sales transactions"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'POS' },
          ]}
        />
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No warehouses found for this branch. Please create a warehouse first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <PageHeader
        title="Point of Sale"
        description="Process sales transactions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'POS' },
        ]}
      />

      {/* Today's Summary */}
      <POSTodaySummary branchId={selectedBranch?.id} />

      {/* Warehouse Selection */}
      {warehouses.length > 1 && (
        <Card className="mt-4 sm:mt-6">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="warehouse-select" className="text-sm sm:text-base">
                Select Warehouse:
              </Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger id="warehouse-select" className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile: Stack vertically, Desktop: 2/3 + 1/3 grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* Product Grid */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <POSProductGrid
            warehouseId={selectedWarehouse}
            onAddToCart={handleAddToCart}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Cart and Payment - Show first on mobile for better UX */}
        <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
          {!showPayment ? (
            <>
              <POSCart
                items={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onUpdateUOM={handleUpdateUOM}
                onItemDiscount={handleItemDiscount}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onCheckout={handleCheckout}
              />

              {/* Pending Orders */}
              <POSPendingOrders
                branchId={selectedBranch?.id}
                onConvertOrder={handleConvertOrder}
              />
            </>
          ) : (
            selectedBranch && selectedWarehouse ? (
              <POSPayment
                cart={cart}
                branchId={selectedBranch.id}
                warehouseId={selectedWarehouse}
                convertedFromOrderIds={convertingOrderIds}
                onComplete={handlePaymentComplete}
                onCancel={() => setShowPayment(false)}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Please select a branch and warehouse to process payment
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && completedSale && (
        <POSReceipt
          sale={completedSale}
          open={showReceipt}
          onClose={handleNewSale}
        />
      )}
    </div>
  );
}
