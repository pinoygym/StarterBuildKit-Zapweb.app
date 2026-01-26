import { WalletAdmin } from '@/components/cooperative/wallet/WalletAdmin';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'E-Wallet Admin | InventoryPro',
    description: 'Manage cooperative member wallets and transactions.',
};

export default function WalletPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <WalletAdmin />
        </div>
    );
}
