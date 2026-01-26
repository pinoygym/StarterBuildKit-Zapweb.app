import { CooperativeDashboard } from '@/components/cooperative/CooperativeDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Cooperative Management | InventoryPro',
    description: 'Manage cooperative members, initiatives, and finances.',
};

export default function CooperativePage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <CooperativeDashboard />
        </div>
    );
}
