'use client';

import { useState } from 'react';
import { MoreHorizontal, ArrowRightLeft, Edit, History } from 'lucide-react';
import { InventoryWithRelations } from '@/types/inventory.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductHistoryDialog } from '@/components/products/product-history-dialog';

interface InventoryTableProps {
  inventory: InventoryWithRelations[];
  onTransfer?: (item: InventoryWithRelations) => void;
  onAdjust?: (item: InventoryWithRelations) => void;
}

export function InventoryTable({ inventory, onTransfer, onAdjust }: InventoryTableProps) {
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryWithRelations | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const handleRowClick = (item: InventoryWithRelations) => {
    setSelectedItem(item);
    setHistoryDialogOpen(true);
  };

  const handleHistoryClick = (e: React.MouseEvent, item: InventoryWithRelations) => {
    e.stopPropagation(); // Prevent row click
    setSelectedItem(item);
    setHistoryDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Base UOM</TableHead>
              <TableHead>Qty in Alt. UOMs</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Avg. Unit Cost</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item) => {
                const totalValue = Number(item.quantity) * Number(item.Product.averageCostPrice || 0);

                return (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(item)}
                  >
                    <TableCell className="font-medium">{item.Product.name}</TableCell>
                    <TableCell>{item.Product.category}</TableCell>
                    <TableCell>{item.Warehouse.name}</TableCell>
                    <TableCell>{item.Product.baseUOM}</TableCell>
                    <TableCell className="max-w-[250px]">
                      {item.Product.productUOMs && item.Product.productUOMs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.Product.productUOMs.map((uom) => {
                            const baseQty = Number(item.quantity);
                            const convertedQty = baseQty / uom.conversionFactor;
                            return (
                              <span
                                key={uom.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                              >
                                {convertedQty.toFixed(2)} {uom.name}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.quantity).toFixed(2)} {item.Product.baseUOM}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(item.Product.averageCostPrice || 0))}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(totalValue)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => handleHistoryClick(e as any, item)}>
                            <History className="h-4 w-4 mr-2" />
                            View Stock Card
                          </DropdownMenuItem>
                          {onAdjust && (
                            <DropdownMenuItem onClick={() => onAdjust(item)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Adjust Stock
                            </DropdownMenuItem>
                          )}
                          {onTransfer && (
                            <DropdownMenuItem onClick={() => onTransfer(item)}>
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

      {selectedItem && (
        <ProductHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          productId={selectedItem.Product.id}
          productName={selectedItem.Product.name}
        />
      )}
    </>
  );
}
