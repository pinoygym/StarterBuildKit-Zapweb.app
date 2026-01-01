'use client';

import { APWithPayments } from '@/types/ap.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface APTableProps {
  records: APWithPayments[];
  onRecordPayment: (record: APWithPayments) => void;
  onViewDetails?: (record: APWithPayments) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: any; label: string }> = {
    pending: { variant: 'secondary', label: 'Pending' },
    partial: { variant: 'default', label: 'Partial' },
    paid: { variant: 'default', label: 'Paid' },
  };
  const config = variants[status] || { variant: 'secondary', label: status };
  return (
    <Badge variant={config.variant} className={status === 'paid' ? 'bg-green-600' : ''}>
      {config.label}
    </Badge>
  );
};

const isOverdue = (dueDate: Date, status: string) => {
  return status !== 'paid' && new Date(dueDate) < new Date();
};

export function APTable({ records, onRecordPayment, onViewDetails }: APTableProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No payable records found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
            <TableHead className="text-right">Paid Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const overdue = isOverdue(record.dueDate, record.status);
            return (
              <TableRow key={record.id} className={overdue ? 'bg-red-50/50' : ''}>
                <TableCell className="font-medium">
                  {record.supplier?.companyName || 'N/A'}
                  {overdue && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Overdue
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(record.createdAt), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(record.dueDate), 'MMM dd, yyyy')}
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(Number(record.totalAmount))}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(Number(record.paidAmount))}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(Number(record.balance))}
                </TableCell>
                <TableCell>{getStatusBadge(record.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {record.status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onRecordPayment(record)}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Record Payment
                      </Button>
                    )}
                    {onViewDetails && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(record)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
