import { prisma, Prisma } from '@/lib/prisma';
import {
    fundSourceRepository,
    fundTransactionRepository,
    fundTransferRepository
} from '@/repositories/fund-source.repository';
import {
    CreateFundSourceInput,
    UpdateFundSourceInput,
    FundSourceFilters,
    RecordFundTransactionInput,
    CreateFundTransferInput,
    AdjustBalanceInput,
    FundTransactionFilters,
    FundTransferFilters,
} from '@/types/fund-source.types';

export class FundSourceService {
    // ==========================================
    // Fund Source CRUD
    // ==========================================

    async createFundSource(data: CreateFundSourceInput, createdById: string) {
        // Validate unique code
        const existingCode = await fundSourceRepository.findByCode(data.code);
        if (existingCode) {
            throw new Error(`Fund source with code "${data.code}" already exists`);
        }

        // If setting as default, unset other defaults for the same branch
        if (data.isDefault) {
            await this.unsetDefaultFundSources(data.branchId || null);
        }

        return await prisma.$transaction(async (tx) => {
            // Create fund source
            const fundSource = await tx.fundSource.create({
                data: {
                    name: data.name,
                    code: data.code,
                    type: data.type,
                    branchId: data.branchId || null,
                    bankName: data.bankName || null,
                    accountNumber: data.accountNumber || null,
                    accountHolder: data.accountHolder || null,
                    description: data.description || null,
                    openingBalance: data.openingBalance || 0,
                    currentBalance: data.openingBalance || 0,
                    currency: data.currency || 'PHP',
                    isDefault: data.isDefault || false,
                    displayOrder: data.displayOrder || 0,
                },
                include: {
                    Branch: { select: { id: true, name: true, code: true } },
                },
            });

            // Create opening balance transaction if opening balance > 0
            if (data.openingBalance && data.openingBalance > 0) {
                await tx.fundTransaction.create({
                    data: {
                        fundSourceId: fundSource.id,
                        type: 'OPENING_BALANCE',
                        amount: data.openingBalance,
                        runningBalance: data.openingBalance,
                        description: 'Opening balance',
                        transactionDate: new Date(),
                        createdById,
                    },
                });
            }

            return fundSource;
        });
    }

    async updateFundSource(id: string, data: UpdateFundSourceInput) {
        const fundSource = await fundSourceRepository.findById(id);
        if (!fundSource) {
            throw new Error('Fund source not found');
        }

        // Validate unique code if changing
        if (data.code && data.code !== fundSource.code) {
            const existingCode = await fundSourceRepository.findByCode(data.code);
            if (existingCode) {
                throw new Error(`Fund source with code "${data.code}" already exists`);
            }
        }

        // If setting as default, unset other defaults
        if (data.isDefault && !fundSource.isDefault) {
            await this.unsetDefaultFundSources(data.branchId ?? fundSource.branchId);
        }

        return await fundSourceRepository.update(id, {
            name: data.name,
            code: data.code,
            type: data.type,
            Branch: data.branchId ? { connect: { id: data.branchId } } : undefined,
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            accountHolder: data.accountHolder,
            description: data.description,
            currency: data.currency,
            status: data.status,
            isDefault: data.isDefault,
            displayOrder: data.displayOrder,
        });
    }

    async getFundSourceById(id: string) {
        const fundSource = await fundSourceRepository.findById(id);
        if (!fundSource) {
            throw new Error('Fund source not found');
        }
        return fundSource;
    }

    async getAllFundSources(filters?: FundSourceFilters) {
        return await fundSourceRepository.findAll(filters);
    }

    async getFundSourcesByBranch(branchId: string | null) {
        return await fundSourceRepository.findByBranch(branchId);
    }

    async deleteFundSource(id: string) {
        const fundSource = await fundSourceRepository.findById(id);
        if (!fundSource) {
            throw new Error('Fund source not found');
        }

        // Check if fund source has transactions
        if (fundSource._count && (
            fundSource._count.FundTransactions > 0 ||
            fundSource._count.APPayments > 0 ||
            fundSource._count.ARPayments > 0 ||
            fundSource._count.Expenses > 0
        )) {
            // Soft delete
            return await fundSourceRepository.delete(id);
        }

        // Hard delete if no transactions
        return await prisma.fundSource.delete({ where: { id } });
    }

    // ==========================================
    // Balance Management
    // ==========================================

    async recordDeposit(
        fundSourceId: string,
        amount: number,
        description: string,
        createdById: string,
        referenceType?: string,
        referenceId?: string,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx || prisma;

        const fundSource = await client.fundSource.findUnique({
            where: { id: fundSourceId },
        });

        if (!fundSource) {
            throw new Error('Fund source not found');
        }

        if (amount <= 0) {
            throw new Error('Deposit amount must be greater than 0');
        }

        const newBalance = fundSource.currentBalance + amount;

        // Create transaction
        await client.fundTransaction.create({
            data: {
                fundSourceId,
                type: 'DEPOSIT',
                amount,
                runningBalance: newBalance,
                referenceType: referenceType || null,
                referenceId: referenceId || null,
                description,
                transactionDate: new Date(),
                createdById,
            },
        });

        // Update balance
        return await client.fundSource.update({
            where: { id: fundSourceId },
            data: { currentBalance: newBalance },
        });
    }

    async recordWithdrawal(
        fundSourceId: string,
        amount: number,
        description: string,
        createdById: string,
        referenceType?: string,
        referenceId?: string,
        tx?: Prisma.TransactionClient,
        skipBalanceCheck: boolean = false
    ) {
        const client = tx || prisma;

        const fundSource = await client.fundSource.findUnique({
            where: { id: fundSourceId },
        });

        if (!fundSource) {
            throw new Error('Fund source not found');
        }

        if (amount <= 0) {
            throw new Error('Withdrawal amount must be greater than 0');
        }

        if (!skipBalanceCheck && amount > fundSource.currentBalance) {
            throw new Error(`Insufficient balance. Available: ₱${fundSource.currentBalance.toLocaleString()}, Required: ₱${amount.toLocaleString()}`);
        }

        const newBalance = fundSource.currentBalance - amount;

        // Create transaction
        await client.fundTransaction.create({
            data: {
                fundSourceId,
                type: 'WITHDRAWAL',
                amount,
                runningBalance: newBalance,
                referenceType: referenceType || null,
                referenceId: referenceId || null,
                description,
                transactionDate: new Date(),
                createdById,
            },
        });

        // Update balance
        return await client.fundSource.update({
            where: { id: fundSourceId },
            data: { currentBalance: newBalance },
        });
    }

    async adjustBalance(data: AdjustBalanceInput) {
        const fundSource = await fundSourceRepository.findById(data.fundSourceId);
        if (!fundSource) {
            throw new Error('Fund source not found');
        }

        const difference = data.newBalance - fundSource.currentBalance;
        const type = difference >= 0 ? 'ADJUSTMENT' : 'ADJUSTMENT';

        return await prisma.$transaction(async (tx) => {
            // Create adjustment transaction
            await tx.fundTransaction.create({
                data: {
                    fundSourceId: data.fundSourceId,
                    type,
                    amount: Math.abs(difference),
                    runningBalance: data.newBalance,
                    referenceType: 'ADJUSTMENT',
                    description: `Balance adjustment: ${data.reason}`,
                    transactionDate: new Date(),
                    createdById: data.createdById,
                },
            });

            // Update balance
            return await tx.fundSource.update({
                where: { id: data.fundSourceId },
                data: { currentBalance: data.newBalance },
                include: {
                    Branch: { select: { id: true, name: true, code: true } },
                },
            });
        });
    }

    // ==========================================
    // Fund Transfers
    // ==========================================

    async createTransfer(data: CreateFundTransferInput) {
        const [fromFundSource, toFundSource] = await Promise.all([
            fundSourceRepository.findById(data.fromFundSourceId),
            fundSourceRepository.findById(data.toFundSourceId),
        ]);

        if (!fromFundSource) {
            throw new Error('Source fund source not found');
        }

        if (!toFundSource) {
            throw new Error('Destination fund source not found');
        }

        if (data.fromFundSourceId === data.toFundSourceId) {
            throw new Error('Cannot transfer to the same fund source');
        }

        if (data.amount <= 0) {
            throw new Error('Transfer amount must be greater than 0');
        }

        const totalDeduction = data.amount + (data.transferFee || 0);
        if (totalDeduction > fromFundSource.currentBalance) {
            throw new Error(`Insufficient balance. Available: ₱${fromFundSource.currentBalance.toLocaleString()}, Required: ₱${totalDeduction.toLocaleString()}`);
        }

        const netAmount = data.amount - (data.transferFee || 0);
        const transferNumber = await fundTransferRepository.getNextTransferNumber();

        return await prisma.$transaction(async (tx) => {
            // Create transfer record
            const transfer = await tx.fundTransfer.create({
                data: {
                    transferNumber,
                    fromFundSourceId: data.fromFundSourceId,
                    toFundSourceId: data.toFundSourceId,
                    amount: data.amount,
                    transferFee: data.transferFee || 0,
                    netAmount,
                    description: data.description || null,
                    status: 'completed',
                    transferDate: data.transferDate || new Date(),
                    createdById: data.createdById,
                },
                include: {
                    FromFundSource: { select: { id: true, name: true, code: true } },
                    ToFundSource: { select: { id: true, name: true, code: true } },
                    CreatedBy: { select: { id: true, firstName: true, lastName: true } },
                },
            });

            // Deduct from source (amount + fee)
            const newFromBalance = fromFundSource.currentBalance - totalDeduction;
            await tx.fundTransaction.create({
                data: {
                    fundSourceId: data.fromFundSourceId,
                    type: 'TRANSFER_OUT',
                    amount: totalDeduction,
                    runningBalance: newFromBalance,
                    referenceType: 'TRANSFER',
                    referenceId: transfer.id,
                    description: `Transfer to ${toFundSource.name}${data.transferFee ? ` (Fee: ₱${data.transferFee.toLocaleString()})` : ''}`,
                    transactionDate: new Date(),
                    createdById: data.createdById,
                },
            });
            await tx.fundSource.update({
                where: { id: data.fromFundSourceId },
                data: { currentBalance: newFromBalance },
            });

            // Add to destination (net amount)
            const newToBalance = toFundSource.currentBalance + netAmount;
            await tx.fundTransaction.create({
                data: {
                    fundSourceId: data.toFundSourceId,
                    type: 'TRANSFER_IN',
                    amount: netAmount,
                    runningBalance: newToBalance,
                    referenceType: 'TRANSFER',
                    referenceId: transfer.id,
                    description: `Transfer from ${fromFundSource.name}`,
                    transactionDate: new Date(),
                    createdById: data.createdById,
                },
            });
            await tx.fundSource.update({
                where: { id: data.toFundSourceId },
                data: { currentBalance: newToBalance },
            });

            return transfer;
        });
    }

    async getTransferById(id: string) {
        const transfer = await fundTransferRepository.findById(id);
        if (!transfer) {
            throw new Error('Transfer not found');
        }
        return transfer;
    }

    async getAllTransfers(filters?: FundTransferFilters) {
        return await fundTransferRepository.findAll(filters);
    }

    // ==========================================
    // Transactions
    // ==========================================

    async getTransactionHistory(fundSourceId: string, filters?: FundTransactionFilters) {
        const fundSource = await fundSourceRepository.findById(fundSourceId);
        if (!fundSource) {
            throw new Error('Fund source not found');
        }

        return await fundTransactionRepository.findByFundSource(fundSourceId, filters);
    }

    async getRecentTransactions(limit: number = 10, branchId?: string) {
        return await fundTransactionRepository.getRecentTransactions(limit, branchId);
    }

    // ==========================================
    // Summary & Dashboard
    // ==========================================

    async getSummary(branchId?: string) {
        return await fundSourceRepository.getSummary(branchId);
    }

    async getDashboardData(branchId?: string) {
        const [summary, recentTransactions] = await Promise.all([
            this.getSummary(branchId),
            this.getRecentTransactions(10, branchId),
        ]);

        // Get fund sources with low balance (< 10% of max balance in same type)
        const fundSources = await this.getAllFundSources({
            branchId,
            status: 'active',
        });

        // Simple low balance check - less than ₱1,000
        const lowBalanceAlerts = fundSources.filter(fs => fs.currentBalance < 1000);

        return {
            summary,
            recentTransactions,
            lowBalanceAlerts,
        };
    }

    // ==========================================
    // Helpers
    // ==========================================

    private async unsetDefaultFundSources(branchId: string | null) {
        await prisma.fundSource.updateMany({
            where: {
                branchId,
                isDefault: true,
            },
            data: {
                isDefault: false,
            },
        });
    }

    async validateFundSourceBalance(fundSourceId: string, amount: number): Promise<boolean> {
        const fundSource = await fundSourceRepository.findById(fundSourceId);
        if (!fundSource) {
            return false;
        }
        return fundSource.currentBalance >= amount;
    }

    async getDefaultFundSource(branchId?: string) {
        return await fundSourceRepository.getDefaultFundSource(branchId);
    }
}

export const fundSourceService = new FundSourceService();
