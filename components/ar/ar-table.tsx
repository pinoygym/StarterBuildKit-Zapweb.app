'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, DollarSign, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ARStatusBadge } from './ar-status-badge';
import { PaymentDialog } from './payment-dialog';

interface ARRecord {
  id: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  dueDate: Date;
  updatedAt: Date;
  Branch: {
    name: string;
  };
}

interface ARTableProps {
  data: ARRecord[];
  limit?: number;
  fundSources: any[]; // Passed down to dialog
}

export function ARTable({ data, limit = 10, fundSources }: ARTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAR, setSelectedAR] = useState<ARRecord | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Simple client-side filtering logic for now (can upgrade to server-side later)
  const filteredData = data.filter((record) =>
    record.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.Branch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePaymentClick = (ar: ARRecord) => {
    setSelectedAR(ar);
    setIsPaymentOpen(true);
  };

  const onPaymentSuccess = () => {
    // Refresh data - in a real app this would trigger a router refresh
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.customerName}</TableCell>
                  <TableCell>{record.Branch.name}</TableCell>
                  <TableCell>{formatCurrency(record.totalAmount)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCurrency(record.paidAmount)}
                  </TableCell>
                  <TableCell className="font-bold text-primary">
                    {formatCurrency(record.balance)}
                  </TableCell>
                  <TableCell>
                    <ARStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell>{formatDate(record.dueDate)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(record.id)}
                        >
                          Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handlePaymentClick(record)}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Record Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentDialog
        ar={selectedAR}
        fundSources={fundSources}
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        onPaymentSuccess={onPaymentSuccess}
      />
    </div>
  );
}
