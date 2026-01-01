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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { InventoryBatchWithRelations } from '@/types/inventory.types';

const adjustStockSchema = z.object({
  newQuantity: z.number().nonnegative('Quantity must be zero or greater'),
  reason: z.string().min(1, 'Reason is required'),
});

type AdjustStockFormData = z.infer<typeof adjustStockSchema>;

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: InventoryBatchWithRelations | null;
  onSuccess: () => void;
}

export function AdjustStockDialog({
  open,
  onOpenChange,
  batch,
  onSuccess,
}: AdjustStockDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdjustStockFormData>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      newQuantity: 0,
      reason: '',
    },
  });

  useEffect(() => {
    if (batch && open) {
      form.reset({
        newQuantity: Number(batch.quantity),
        reason: '',
      });
    }
  }, [batch, open, form]);

  const onSubmit = async (data: AdjustStockFormData) => {
    if (!batch) return;

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          newQuantity: data.newQuantity,
          reason: data.reason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Stock adjusted successfully',
        });
        onOpenChange(false);
        form.reset();
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to adjust stock',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to adjust stock',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!batch) return null;

  const currentQuantity = Number(batch.quantity);
  const newQuantity = form.watch('newQuantity');
  const difference = newQuantity - currentQuantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            Manually adjust inventory quantity for corrections, damages, or write-offs
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Product:</strong> {batch.product.name}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Warehouse:</strong> {batch.warehouse.name}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Batch:</strong> {batch.batchNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Current Quantity:</strong> {currentQuantity} {batch.product.baseUOM}
              </p>
              {difference !== 0 && (
                <p className={`text-sm font-medium ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <strong>Adjustment:</strong> {difference > 0 ? '+' : ''}{difference} {batch.product.baseUOM}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="newQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Quantity ({batch.product.baseUOM})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
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
                      placeholder="e.g., Physical count correction, Damage, Expiry write-off..."
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
                {isSubmitting ? 'Adjusting...' : 'Adjust Stock'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
