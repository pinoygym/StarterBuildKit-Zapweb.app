import { CoordinationCenter } from '@/components/cooperative/coordination/CoordinationCenter';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Coordination Center | InventoryPro',
    description: 'Manage cooperative initiatives, vote on proposals, and track tasks.',
};

export default function CoordinationPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <CoordinationCenter />
        </div>
    );
}
