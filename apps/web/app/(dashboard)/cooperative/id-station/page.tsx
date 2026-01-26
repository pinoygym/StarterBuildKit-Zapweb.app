import { IDStation } from '@/components/cooperative/id-station/IDStation';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ID Station | InventoryPro',
    description: 'Design and manage membership ID cards.',
};

export default function IDStationPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <IDStation />
        </div>
    );
}
