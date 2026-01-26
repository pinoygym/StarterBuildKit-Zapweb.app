import { FarmManagement } from '@/components/cooperative/farms/FarmManagement';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Farm Management | InventoryPro',
    description: 'Manage cooperative farms and harvests.',
};

export default function FarmsPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <FarmManagement />
        </div>
    );
}
