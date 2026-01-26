import { MemberRegistry } from '@/components/cooperative/members/MemberRegistry';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Member Registry | InventoryPro',
    description: 'View and manage cooperative members.',
};

export default function MembersPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <MemberRegistry />
        </div>
    );
}
