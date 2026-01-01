'use client';

import React, { useState } from 'react';
import { Customer } from '@prisma/client';
import { Edit, Trash2, User, Mail, Phone, Building } from 'lucide-react';
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
import { CustomerWithRelations } from '@/types/customer.types';

interface CustomerTableProps {
  customers: CustomerWithRelations[];
  onEdit: (customer: CustomerWithRelations) => void;
  onDelete: (id: string) => Promise<any>;
}

export function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerWithRelations | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (customer: CustomerWithRelations) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    setDeleting(true);
    try {
      const result = await onDelete(customerToDelete.id);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Customer deleted successfully',
        });
        setDeleteDialogOpen(false);
        setCustomerToDelete(null);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete customer',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Code</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Credit Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No customers found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {customer.customerCode}
                    </div>
                  </TableCell>
                  <TableCell>{customer.contactPerson}</TableCell>
                  <TableCell>
                    {customer.companyName ? (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        {customer.companyName}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {customer.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {customer.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {customer.customerType}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(customer.creditLimit ? Number(customer.creditLimit) : null)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={customer.status === 'active' ? 'default' : 'secondary'}
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(customer)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete "${customerToDelete?.contactPerson}"? This will set the customer status to inactive.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
