'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { APBatchPaymentForm } from '@/components/ap/batch-payment-form';

export function NewAPBatchPaymentContent() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        try {
            const response = await fetch('/api/ap/payment/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Batch payment recorded successfully');
                router.push('/ar-ap?tab=ap'); // Redirect to AP tab
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
                title="Record AP Batch Payment"
                description="Apply a single payment across multiple payables"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'AP', href: '/ar-ap?tab=ap' },
                    { label: 'New Batch Payment' },
                ]}
            />

            <APBatchPaymentForm
                onSubmit={handleSubmit}
                onCancel={() => router.push('/ar-ap?tab=ap')}
            />
        </div>
    );
}
