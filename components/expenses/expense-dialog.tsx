'use client';

import { useEffect, useState } from 'react';
import { ExpenseWithBranch, ExpenseCategories } from '@/types/expense.types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useBranch } from '@/hooks/use-branch';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  expense?: ExpenseWithBranch | null;
  onSuccess: () => void;
}

export function ExpenseDialog({ open, onClose, expense, onSuccess }: ExpenseDialogProps) {
  const { selectedBranch } = useBranch();
  const isEditing = !!expense;

  const [formData, setFormData] = useState({
    expenseDate: new Date(),
    category: 'Utilities',
    amount: '',
    description: '',
    paymentMethod: 'Cash',
    vendor: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        expenseDate: new Date(expense.expenseDate),
        category: expense.category,
        amount: Number(expense.amount).toString(),
        description: expense.description,
        paymentMethod: expense.paymentMethod,
        vendor: expense.vendor || '',
      });
    } else {
      setFormData({
        expenseDate: new Date(),
        category: 'Utilities',
        amount: '',
        description: '',
        paymentMethod: 'Cash',
        vendor: '',
      });
    }
  }, [expense, open]);

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!selectedBranch && !isEditing) {
      toast.error('Please select a branch');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        amount,
        expenseDate: formData.expenseDate.toISOString(),
        branchId: isEditing ? expense.branchId : selectedBranch!.id,
        vendor: formData.vendor || undefined,
      };

      const url = isEditing ? `/api/expenses/${expense.id}` : '/api/expenses';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Expense ${isEditing ? 'updated' : 'created'} successfully`);
        onSuccess();
        handleClose();
      } else {
        toast.error(result.error || `Failed to ${isEditing ? 'update' : 'create'} expense`);
      }
    } catch (error) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} expense`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Create Expense'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update expense details' : 'Record a new business expense'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expense Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.expenseDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expenseDate ? format(formData.expenseDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.expenseDate}
                    onSelect={(date) => date && setFormData({ ...formData, expenseDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ExpenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₱) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter expense description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select 
                value={formData.paymentMethod} 
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Debit Card">Debit Card</SelectItem>
                  <SelectItem value="GCash">GCash</SelectItem>
                  <SelectItem value="PayMaya">PayMaya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor (Optional)</Label>
              <Input
                id="vendor"
                placeholder="Vendor name"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Expense' : 'Create Expense')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
