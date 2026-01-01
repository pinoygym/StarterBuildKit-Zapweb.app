'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useWarehouses } from '@/hooks/use-warehouses';
import { InventoryBatchWithRelations } from '@/types/inventory.types';
import { TransferSlipPrint } from './transfer-slip-print';

const transferStockSchema = z.object({
  sourceWarehouseId: z.string().min(1, 'Source warehouse is required'),
  destinationWarehouseId: z.string().min(1, 'Destination warehouse is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  reason: z.string().min(1, 'Reason is required'),
}).refine(
  (data) => data.sourceWarehouseId !== data.destinationWarehouseId,
  {
    message: 'Source and destination warehouses must be different',
    path: ['destinationWarehouseId'],
  }
);

type TransferStockFormData = z.infer<typeof transferStockSchema>;

interface TransferStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: InventoryBatchWithRelations | null;
  onSuccess: () => void;
}

export function TransferStockDialog({
  open,
  onOpenChange,
  batch,
  onSuccess,
}: TransferStockDialogProps) {
  const { toast } = useToast();
  const { warehouses } = useWarehouses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTransferSlip, setShowTransferSlip] = useState(false);
  const [transferData, setTransferData] = useState<any>(null);

  const form = useForm<TransferStockFormData>({
    resolver: zodResolver(transferStockSchema),
    defaultValues: {
      sourceWarehouseId: '',
      destinationWarehouseId: '',
      quantity: 0,
      reason: '',
    },
  });

  useEffect(() => {
    if (batch && open) {
      form.reset({
        sourceWarehouseId: batch.warehouseId,
        destinationWarehouseId: '',
        quantity: Number(batch.quantity),
        reason: '',
      });
    }
  }, [batch, open, form]);

  const onSubmit = async (data: TransferStockFormData) => {
    if (!batch) return;

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: batch.productId,
          sourceWarehouseId: data.sourceWarehouseId,
          destinationWarehouseId: data.destinationWarehouseId,
          quantity: data.quantity,
          uom: batch.product.baseUOM,
          reason: data.reason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Prepare transfer slip data
        const sourceWH = warehouses.find(w => w.id === data.sourceWarehouseId);
        const destWH = warehouses.find(w => w.id === data.destinationWarehouseId);
        
        setTransferData({
          transferNumber: `TSF-${Date.now()}`,
          transferDate: new Date(),
          productName: batch.product.name,
          batchNumber: batch.batchNumber,
          quantity: data.quantity,
          uom: batch.product.baseUOM,
          sourceWarehouse: {
            name: sourceWH?.name || 'Unknown',
            location: sourceWH?.location || '',
          },
          destinationWarehouse: {
            name: destWH?.name || 'Unknown',
            location: destWH?.location || '',
          },
          reason: data.reason,
        });
        
        toast({
          title: 'Success',
          description: 'Stock transferred successfully',
        });
        onOpenChange(false);
        setShowTransferSlip(true);
        form.reset();
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to transfer stock',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error transferring stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to transfer stock',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!batch) return null;

  const availableQuantity = Number(batch.quantity);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transfer Stock</DialogTitle>
          <DialogDescription>
            Transfer {batch.product.name} between warehouses
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Product:</strong> {batch.product.name}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Batch:</strong> {batch.batchNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Available:</strong> {availableQuantity} {batch.product.baseUOM}
              </p>
            </div>

            <FormField
              control={form.control}
              name="sourceWarehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Warehouse</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source warehouse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destinationWarehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Warehouse</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination warehouse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses
                        .filter((w) => w.id !== batch.warehouseId)
                        .map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity ({batch.product.baseUOM})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      max={availableQuantity}
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason for transfer..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Transferring...' : 'Transfer Stock'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Transfer Slip Print Dialog */}
    {transferData && (
      <TransferSlipPrint
        transfer={transferData}
        open={showTransferSlip}
        onClose={() => {
          setShowTransferSlip(false);
          setTransferData(null);
        }}
      />
    )}
    </>
  );
}
