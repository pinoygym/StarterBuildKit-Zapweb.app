'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { BatchPaymentForm } from '@/components/ar/batch-payment-form';

export function NewBatchPaymentContent() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        try {
            const response = await fetch('/api/ar/payment/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Batch payment recorded successfully');
                router.push('/ar');
                return true;
            } else {
                toast.error(result.error || 'Failed to record batch payment');
                return false;
            }
        } catch (error) {
            console.error(error);
            toast.error('An unexpected error occurred');
            return false;
        }
    };

    return (
        <div className="p-6">
            <PageHeader
                title="Record Batch Payment"
                description="Apply a single payment across multiple invoices"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'AR', href: '/ar' },
                    { label: 'New Batch Payment' },
                ]}
            />

            <BatchPaymentForm
                onSubmit={handleSubmit}
                onCancel={() => router.push('/ar')}
            />
        </div>
    );
}
