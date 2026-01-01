'use client';

import React, { useState } from 'react';
import { ProductWithUOMs } from '@/types/product.types';
import { Edit, Trash2, ChevronDown, ChevronRight, Package, Tag, Wallet, Barcode } from 'lucide-react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth.context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductTableProps {
  products: ProductWithUOMs[];
  onEdit: (product: ProductWithUOMs) => void;
  onDelete: (id: string) => Promise<any>;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithUOMs | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (productId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  const handleDeleteClick = (product: ProductWithUOMs) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      const result = await onDelete(productToDelete.id);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Product deleted successfully',
        });
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete product',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="border rounded-lg hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Actions</TableHead>
              {/* <TableHead className="w-[80px]">Image</TableHead> */}
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Avg Cost</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>Min Stock</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <React.Fragment key={product.id}>
                <TableRow>
                  <TableCell>
                    {product.alternateUOMs.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(product.id)}
                        className="h-8 w-8 p-0"
                      >
                        {expandedRows.has(product.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(product)}
                        disabled={user?.Role?.name !== 'Super Admin' && user?.Role?.name !== 'Branch Manager'}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                  {/* 
                  <TableCell>
                    <div className="w-12 h-12 relative rounded overflow-hidden bg-muted flex items-center justify-center">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  */}
                  <TableCell className="font-medium">
                    <div>
                      <div>{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(Number(product.basePrice))}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(Number(product.averageCostPrice))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {product.baseUOM}
                    </code>
                  </TableCell>
                  <TableCell>{product.minStockLevel}</TableCell>
                  <TableCell>
                    {new Date(product.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.status === 'active' ? 'default' : 'secondary'}
                    >
                      {product.status}
                    </Badge>
                  </TableCell>

                </TableRow>

                {/* Expanded row showing alternate UOMs */}
                {expandedRows.has(product.id) && product.alternateUOMs.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="bg-muted/50">
                      <div className="py-2 px-4">
                        <div className="text-sm font-medium mb-2">Alternate UOMs:</div>
                        <div className="grid grid-cols-3 gap-4">
                          {product.alternateUOMs.map((uom) => (
                            <div
                              key={uom.id}
                              className="flex items-center justify-between p-2 bg-background rounded border"
                            >
                              <div>
                                <div className="font-medium">{uom.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {Number(uom.conversionFactor)}x {product.baseUOM}
                                </div>
                              </div>
                              <div className="text-sm font-medium">
                                {formatCurrency(Number(uom.sellingPrice))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">{product.name}</CardTitle>
              <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                {product.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-3">
                {/* 
                <div className="w-16 h-16 relative rounded overflow-hidden bg-muted flex items-center justify-center">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                */}
                <div className="flex-1 space-y-1">
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center text-sm">
                    <Tag className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-muted-foreground mr-1">Category:</span>
                    <Badge variant="outline">{product.category}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <Wallet className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-muted-foreground mr-1">Price:</span>
                  {formatCurrency(Number(product.basePrice))}
                </div>
                <div className="flex items-center">
                  <Barcode className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-muted-foreground mr-1">UOM:</span>
                  <code className="bg-muted px-1 rounded">{product.baseUOM}</code>
                </div>
              </div>
              {product.alternateUOMs.length > 0 && (
                <div className="mt-3 pt-2 border-t text-sm">
                  <div className="font-medium mb-1">Alternate UOMs:</div>
                  <div className="flex flex-wrap gap-2">
                    {product.alternateUOMs.map((uom) => (
                      <Badge key={uom.id} variant="secondary" className="flex items-center">
                        {uom.name} ({Number(uom.conversionFactor)}x {product.baseUOM}) - {formatCurrency(Number(uom.sellingPrice))}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(product)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteClick(product)}
                disabled={user?.Role?.name !== 'Super Admin' && user?.Role?.name !== 'Branch Manager'}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
