'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { FileText, DollarSign } from 'lucide-react';
import { useBranch } from '@/hooks/use-branch';
import { useAR } from '@/hooks/use-ar';
import { useAP } from '@/hooks/use-ap';
import { ARTable } from '@/components/ar/ar-table';
import { ARPaymentDialog } from '@/components/ar/ar-payment-dialog';
import { APTable } from '@/components/ap/ap-table';
import { APPaymentDialog } from '@/components/ap/ap-payment-dialog';
import { ARWithPayments } from '@/types/ar.types';
import { APWithPayments } from '@/types/ap.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ARAPPage() {
  const [activeTab, setActiveTab] = useState('ar');
  const { selectedBranch } = useBranch();
  
  // AR State
  const [arStatusFilter, setArStatusFilter] = useState<string | undefined>(undefined);
  const { records: arRecords, loading: arLoading, refetch: refetchAR } = useAR({ 
    branchId: selectedBranch?.id,
    status: arStatusFilter,
  });
  const [selectedARRecord, setSelectedARRecord] = useState<ARWithPayments | null>(null);
  const [arPaymentDialogOpen, setArPaymentDialogOpen] = useState(false);

  // AP State
  const [apStatusFilter, setApStatusFilter] = useState<string | undefined>(undefined);
  const { records: apRecords, loading: apLoading, refetch: refetchAP } = useAP({ 
    branchId: selectedBranch?.id,
    status: apStatusFilter,
  });
  const [selectedAPRecord, setSelectedAPRecord] = useState<APWithPayments | null>(null);
  const [apPaymentDialogOpen, setApPaymentDialogOpen] = useState(false);

  const handleARPayment = (record: ARWithPayments) => {
    setSelectedARRecord(record);
    setArPaymentDialogOpen(true);
  };

  const handleAPPayment = (record: APWithPayments) => {
    setSelectedAPRecord(record);
    setApPaymentDialogOpen(true);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Accounts Receivable & Payable"
        description="Manage customer receivables and supplier payables"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'AR/AP' },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="ar" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Accounts Receivable
          </TabsTrigger>
          <TabsTrigger value="ap" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Accounts Payable
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ar" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={arStatusFilter || 'all'} onValueChange={(v) => setArStatusFilter(v === 'all' ? undefined : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="p-6">
            {arLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <ARTable 
                records={arRecords} 
                onRecordPayment={handleARPayment}
              />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="ap" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={apStatusFilter || 'all'} onValueChange={(v) => setApStatusFilter(v === 'all' ? undefined : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="p-6">
            {apLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <APTable 
                records={apRecords} 
                onRecordPayment={handleAPPayment}
              />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialogs */}
      <ARPaymentDialog
        open={arPaymentDialogOpen}
        onClose={() => {
          setArPaymentDialogOpen(false);
          setSelectedARRecord(null);
        }}
        record={selectedARRecord}
        onSuccess={refetchAR}
      />

      <APPaymentDialog
        open={apPaymentDialogOpen}
        onClose={() => {
          setApPaymentDialogOpen(false);
          setSelectedAPRecord(null);
        }}
        record={selectedAPRecord}
        onSuccess={refetchAP}
      />
    </div>
  );
}
