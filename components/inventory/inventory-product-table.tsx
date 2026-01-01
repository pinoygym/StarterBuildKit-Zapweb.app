'use client';

import { Package2 } from 'lucide-react';
import { ProductInventorySummary } from '@/types/inventory.types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface InventoryProductTableProps {
    products: ProductInventorySummary[];
}

export function InventoryProductTable({ products }: InventoryProductTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const formatQuantity = (quantity: number) => {
        return Number(quantity).toFixed(2);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Total Quantity</TableHead>
                        <TableHead className="text-right">Avg Cost</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead>Warehouses</TableHead>
                        <TableHead className="text-center">Batches</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                No products found
                            </TableCell>
                        </TableRow>
                    ) : (
                        products.map((product) => (
                            <TableRow key={product.productId}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Package2 className="h-4 w-4 text-muted-foreground" />
                                        {product.productName}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{product.category}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatQuantity(product.totalQuantity)} {product.baseUOM}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(product.weightedAverageCost)}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                    {formatCurrency(product.totalValue)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {product.warehouses.map((wh) => (
                                            <div key={wh.warehouseId} className="text-sm">
                                                <span className="font-medium">{wh.warehouseName}:</span>{' '}
                                                <span className="text-muted-foreground">
                                                    {formatQuantity(wh.quantity)} {product.baseUOM}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary">{product.batchCount}</Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
