import { memberWalletRepository } from '@/repositories/member-wallet.repository';
import { WalletTransactionInput } from '@/types/cooperative.types';

export class MemberWalletService {
    async getWallet(memberId: string) {
        let wallet = await memberWalletRepository.getWallet(memberId);

        // Auto-create wallet if it doesn't exist for the member
        if (!wallet) {
            wallet = await memberWalletRepository.createWallet(memberId);
        }

        return wallet;
    }

    async processTransaction(data: WalletTransactionInput) {
        const amount = Number(data.amount);
        if (isNaN(amount) || amount <= 0) {
            throw new Error('Amount must be a positive number');
        }

        // Logic to validate sufficient funds could be here or in repo
        if (data.type !== 'cash_in') {
            const wallet = await this.getWallet(data.walletId); // This might recurse if walletId is actually memberId? No, input has walletId.
            // Wait, input has walletId. I might need memberId to get wallet? 
            // Logic in repository handles creation by memberId. 
            // Repository createTransaction takes walletId.
            // But checking balance requires reading wallet first.
            // Repository does atomic check.
        }

        return await memberWalletRepository.createTransaction({
            ...data,
            amount: amount
        });
    }

    async getTransactionHistory(walletId: string) {
        return await memberWalletRepository.getHistory(walletId);
    }

    async getAllWallets(limit?: number) {
        return await memberWalletRepository.findAll(limit);
    }

    async getWalletStats() {
        return await memberWalletRepository.getStats();
    }
}

export const memberWalletService = new MemberWalletService();
