import { prisma } from '@/lib/prisma';
import { MemberWallet, WalletTransaction } from '@prisma/client';
import { WalletTransactionInput } from '@/types/cooperative.types';

export class MemberWalletRepository {
    async getWallet(memberId: string): Promise<MemberWallet | null> {
        return prisma.memberWallet.findUnique({
            where: { memberId },
            include: {
                Transactions: {
                    orderBy: { transactionDate: 'desc' },
                    take: 10
                }
            }
        });
    }

    async createWallet(memberId: string): Promise<MemberWallet> {
        return prisma.memberWallet.create({
            data: {
                memberId,
                walletBalance: 0,
                shareCapital: 0,
                savingsBalance: 0,
                status: 'active'
            }
        });
    }

    async createTransaction(data: WalletTransactionInput): Promise<WalletTransaction> {
        // Use a transaction to update balance and create record atomically
        return prisma.$transaction(async (tx) => {
            const wallet = await tx.memberWallet.findUnique({ where: { id: data.walletId } });
            if (!wallet) throw new Error('Wallet not found');

            let balanceChange = 0;
            const amount = Number(data.amount);

            if (data.type === 'cash_in') {
                balanceChange = amount;
            } else {
                balanceChange = -amount;
            }

            const newBalance = wallet.walletBalance + balanceChange;

            // Optional: Check for insufficient funds
            if (balanceChange < 0 && newBalance < 0) {
                throw new Error(`Insufficient funds. Current balance: ${wallet.walletBalance}`);
            }

            // Update wallet
            await tx.memberWallet.update({
                where: { id: data.walletId },
                data: {
                    walletBalance: newBalance,
                    updatedAt: new Date()
                }
            });

            // Create transaction record
            return tx.walletTransaction.create({
                data: {
                    ...data,
                    amount: amount,
                    balanceBefore: wallet.walletBalance,
                    balanceAfter: newBalance,
                    status: 'completed',
                    transactionDate: new Date()
                }
            });
        });
    }

    async getHistory(walletId: string): Promise<WalletTransaction[]> {
        return prisma.walletTransaction.findMany({
            where: { walletId },
            orderBy: { transactionDate: 'desc' },
            include: {
                Wallet: {
                    include: { Member: { select: { firstName: true, lastName: true } } }
                }
            }
        });
    }

    async findAll(limit: number = 50): Promise<MemberWallet[]> {
        return prisma.memberWallet.findMany({
            take: limit,
            include: {
                Member: {
                    select: { firstName: true, lastName: true, memberCode: true, photoUrl: true }
                }
            },
            orderBy: { walletBalance: 'desc' }
        });
    }

    async getStats() {
        const aggs = await prisma.memberWallet.aggregate({
            _sum: {
                walletBalance: true,
                shareCapital: true,
                savingsBalance: true
            },
            _count: {
                _all: true
            }
        });

        return {
            totalBalance: aggs._sum.walletBalance || 0,
            totalShareCapital: aggs._sum.shareCapital || 0,
            totalSavings: aggs._sum.savingsBalance || 0,
            activeWallets: aggs._count._all
        };
    }
}

export const memberWalletRepository = new MemberWalletRepository();
