'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/page-header';
import { useBranch } from '@/hooks/use-branch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const expenseFormSchema = z.object({
  expenseDate: z.string().min(1, 'Expense date is required'),
  category: z.enum(
    ['Utilities', 'Rent', 'Salaries', 'Transportation', 'Marketing', 'Maintenance', 'Other'],
    {
      required_error: 'Category is required',
    }
  ),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Amount must be greater than 0'
  ),
  description: z.string().min(1, 'Description is required'),
  vendor: z.string().optional(),
  paymentMethod: z.enum(['Cash', 'Card', 'Check', 'Online Transfer'], {
    required_error: 'Payment method is required',
  }),
  receiptUrl: z.string().url('Invalid receipt URL').optional().or(z.literal('')),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

export default function NewExpensePage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      expenseDate: new Date().toISOString().split('T')[0],
      category: 'Other',
      amount: '',
      description: '',
      vendor: '',
      paymentMethod: 'Cash',
      receiptUrl: '',
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    if (!selectedBranch) {
      toast({
        title: 'Error',
        description: 'Please select a branch first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranch.id,
          expenseDate: new Date(data.expenseDate).toISOString(),
          category: data.category,
          amount: parseFloat(data.amount),
          description: data.description,
          vendor: data.vendor || undefined,
          paymentMethod: data.paymentMethod,
          receiptUrl: data.receiptUrl || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Expense added successfully',
        });
        router.push('/expenses');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add expense',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to add expense',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Add Expense"
        description="Record a new business expense"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Expenses', href: '/expenses' },
          { label: 'New' },
        ]}
      />

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="expenseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Rent">Rent</SelectItem>
                        <SelectItem value="Salaries">Salaries</SelectItem>
                        <SelectItem value="Transportation">Transportation</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter expense description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vendor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Check">Check</SelectItem>
                        <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receiptUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt URL (Optional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Expense
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/expenses')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
