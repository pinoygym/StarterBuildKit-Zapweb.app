'use client';

import React, { useState } from 'react';
import { Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
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
import { WarehouseWithUtilization } from '@/types/warehouse.types';
import { cn } from '@/lib/utils';

interface WarehouseTableProps {
  warehouses: WarehouseWithUtilization[];
  onEdit: (warehouse: WarehouseWithUtilization) => void;
  onDelete: (id: string) => Promise<any>;
}

export function WarehouseTable({ warehouses, onEdit, onDelete }: WarehouseTableProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<WarehouseWithUtilization | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [warehouseDetails, setWarehouseDetails] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  const handleDeleteClick = (warehouse: WarehouseWithUtilization) => {
    setWarehouseToDelete(warehouse);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!warehouseToDelete) return;

    setDeleting(true);
    try {
      const result = await onDelete(warehouseToDelete.id);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Warehouse deleted successfully',
        });
        setDeleteDialogOpen(false);
        setWarehouseToDelete(null);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete warehouse',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete warehouse',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleRow = async (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      // Fetch details if not already loaded
      if (!warehouseDetails[id]) {
        setLoadingDetails(new Set(loadingDetails).add(id));
        try {
          const response = await fetch(`/api/warehouses/${id}`);
          const data = await response.json();
          if (data.success) {
            setWarehouseDetails((prev) => ({ ...prev, [id]: data.data }));
          }
        } catch (error) {
          console.error('Error fetching warehouse details:', error);
        } finally {
          const newLoading = new Set(loadingDetails);
          newLoading.delete(id);
          setLoadingDetails(newLoading);
        }
      }
    }
    setExpandedRows(newExpanded);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-red-600 bg-red-50';
    if (utilization >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getUtilizationBadge = (alertLevel: string) => {
    if (alertLevel === 'critical') return 'destructive';
    if (alertLevel === 'warning') return 'warning';
    return 'default';
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead className="text-right">Capacity</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="text-right">Utilization</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((warehouse) => (
              <React.Fragment key={warehouse.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRow(warehouse.id)}
                      className="h-6 w-6 p-0"
                    >
                      {expandedRows.has(warehouse.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{warehouse.name}</TableCell>
                  <TableCell>{warehouse.location}</TableCell>
                  <TableCell>
                    {(warehouse as any).branch?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{warehouse.manager}</TableCell>
                  <TableCell className="text-right">
                    {warehouse.maxCapacity.toLocaleString()} units
                  </TableCell>
                  <TableCell className="text-right">
                    {warehouse.currentStock.toLocaleString()} units
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-md text-sm font-medium',
                          getUtilizationColor(warehouse.utilization)
                        )}
                      >
                        {warehouse.utilization}%
                      </span>
                      {warehouse.alertLevel !== 'normal' && (
                        <Badge variant={getUtilizationBadge(warehouse.alertLevel)}>
                          {warehouse.alertLevel === 'critical' ? 'Critical' : 'Warning'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(warehouse)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(warehouse)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedRows.has(warehouse.id) && (
                  <TableRow>
                    <TableCell colSpan={9} className="bg-muted/50">
                      <div className="p-4">
                        <h4 className="font-semibold mb-3">Product Distribution</h4>
                        {loadingDetails.has(warehouse.id) ? (
                          <p className="text-muted-foreground text-sm">Loading...</p>
                        ) : warehouseDetails[warehouse.id]?.productDistribution?.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {warehouseDetails[warehouse.id].productDistribution.map((product: any) => (
                              <div
                                key={product.productId}
                                className="bg-background p-3 rounded-md border"
                              >
                                <div className="font-medium text-sm">{product.productName}</div>
                                <div className="text-muted-foreground text-sm">
                                  {product.quantity.toLocaleString()} {product.baseUOM}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            No products in this warehouse
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Warehouse"
        description={`Are you sure you want to delete "${warehouseToDelete?.name}"? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
