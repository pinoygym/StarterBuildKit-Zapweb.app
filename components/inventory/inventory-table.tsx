'use client';

import { MoreHorizontal, ArrowRightLeft, Edit } from 'lucide-react';
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

interface InventoryTableProps {
  inventory: InventoryWithRelations[];
  onTransfer?: (item: InventoryWithRelations) => void;
  onAdjust?: (item: InventoryWithRelations) => void;
}

export function InventoryTable({ inventory, onTransfer, onAdjust }: InventoryTableProps) {
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
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Avg. Unit Cost</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No inventory items found
              </TableCell>
            </TableRow>
          ) : (
            inventory.map((item) => {
              const totalValue = Number(item.quantity) * Number(item.Product.averageCostPrice || 0);

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.Product.name}</TableCell>
                  <TableCell>{item.Product.category}</TableCell>
                  <TableCell>{item.Warehouse.name}</TableCell>
                  <TableCell className="text-right">
                    {Number(item.quantity).toFixed(2)} {item.Product.baseUOM}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(item.Product.averageCostPrice || 0))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(totalValue)}
                  </TableCell>
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
  );
}
