import { MemberRegistrationForm } from '@/components/cooperative/members/MemberRegistrationForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Register Member | InventoryPro',
    description: 'Add a new member to the cooperative.',
};

export default function RegisterMemberPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <MemberRegistrationForm />
        </div>
    );
}
