import { prisma, Prisma } from '@/lib/prisma';
import { FundSourceFilters, FundTransactionFilters } from '@/types/fund-source.types';

export class FundSourceRepository {
    async create(data: Prisma.FundSourceCreateInput) {
        return await prisma.fundSource.create({
            data,
            include: {
                Branch: { select: { id: true, name: true, code: true } },
            },
        });
    }

    async update(id: string, data: Prisma.FundSourceUpdateInput) {
        return await prisma.fundSource.update({
            where: { id },
            data,
            include: {
                Branch: { select: { id: true, name: true, code: true } },
            },
        });
    }

    async findById(id: string) {
        return await prisma.fundSource.findUnique({
            where: { id },
            include: {
                Branch: { select: { id: true, name: true, code: true } },
                _count: {
                    select: {
                        FundTransactions: true,
                        APPayments: true,
                        ARPayments: true,
                        Expenses: true,
                    },
                },
            },
        });
    }

    async findByCode(code: string) {
        return await prisma.fundSource.findUnique({
            where: { code },
        });
    }

    async findAll(filters?: FundSourceFilters) {
        const where: Prisma.FundSourceWhereInput = {};

        if (filters?.branchId) {
            where.branchId = filters.branchId;
        }

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.status) {
            where.status = filters.status;
        } else {
            // By default, don't show closed fund sources
            where.status = { not: 'closed' };
        }

        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { code: { contains: filters.search, mode: 'insensitive' } },
                { bankName: { contains: filters.search, mode: 'insensitive' } },
                { accountNumber: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return await prisma.fundSource.findMany({
            where,
            include: {
                Branch: { select: { id: true, name: true, code: true } },
                _count: {
                    select: {
                        FundTransactions: true,
                        APPayments: true,
                        ARPayments: true,
                        Expenses: true,
                    },
                },
            },
            orderBy: [
                { displayOrder: 'asc' },
                { name: 'asc' },
            ],
        });
    }

    async findByBranch(branchId: string | null) {
        const where: Prisma.FundSourceWhereInput = {
            status: { not: 'closed' },
        };

        if (branchId === null) {
            where.branchId = null;
        } else {
            where.OR = [
                { branchId },
                { branchId: null }, // Include company-wide fund sources
            ];
        }

        return await prisma.fundSource.findMany({
            where,
            include: {
                Branch: { select: { id: true, name: true, code: true } },
            },
            orderBy: [
                { displayOrder: 'asc' },
                { name: 'asc' },
            ],
        });
    }

    async getDefaultFundSource(branchId?: string) {
        const where: Prisma.FundSourceWhereInput = {
            isDefault: true,
            status: 'active',
        };

        if (branchId) {
            where.OR = [
                { branchId },
                { branchId: null },
            ];
        }

        return await prisma.fundSource.findFirst({
            where,
            orderBy: {
                branchId: 'desc', // Prefer branch-specific default over company-wide
            },
        });
    }

    async updateBalance(id: string, newBalance: number, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;
        return await client.fundSource.update({
            where: { id },
            data: { currentBalance: newBalance },
        });
    }

    async delete(id: string) {
        // Soft delete - set status to closed
        return await prisma.fundSource.update({
            where: { id },
            data: { status: 'closed' },
        });
    }

    async getSummary(branchId?: string) {
        const where: Prisma.FundSourceWhereInput = {
            status: { not: 'closed' },
        };

        if (branchId) {
            where.OR = [
                { branchId },
                { branchId: null },
            ];
        }

        const [fundSources, byType] = await Promise.all([
            prisma.fundSource.findMany({
                where,
                select: {
                    id: true,
                    type: true,
                    currentBalance: true,
                    branchId: true,
                    Branch: { select: { id: true, name: true } },
                },
            }),
            prisma.fundSource.groupBy({
                by: ['type'],
                where,
                _count: true,
                _sum: { currentBalance: true },
            }),
        ]);

        const totalBalance = fundSources.reduce((sum, fs) => sum + fs.currentBalance, 0);

        // Group by branch
        const branchMap = new Map<string | null, { branchName: string | null; count: number; totalBalance: number }>();
        for (const fs of fundSources) {
            const key = fs.branchId;
            const existing = branchMap.get(key) || { branchName: fs.Branch?.name || 'Company-wide', count: 0, totalBalance: 0 };
            existing.count++;
            existing.totalBalance += fs.currentBalance;
            branchMap.set(key, existing);
        }

        return {
            totalFundSources: fundSources.length,
            totalBalance,
            byType: byType.map(t => ({
                type: t.type,
                count: t._count,
                totalBalance: t._sum.currentBalance || 0,
            })),
            byBranch: Array.from(branchMap.entries()).map(([branchId, data]) => ({
                branchId,
                branchName: data.branchName,
                count: data.count,
                totalBalance: data.totalBalance,
            })),
        };
    }
}

export class FundTransactionRepository {
    async create(data: Prisma.FundTransactionCreateInput, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;
        return await client.fundTransaction.create({
            data,
            include: {
                CreatedBy: { select: { id: true, firstName: true, lastName: true } },
                FundSource: { select: { id: true, name: true, code: true } },
            },
        });
    }

    async findByFundSource(fundSourceId: string, filters?: FundTransactionFilters) {
        const where: Prisma.FundTransactionWhereInput = { fundSourceId };

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.referenceType) {
            where.referenceType = filters.referenceType;
        }

        if (filters?.fromDate || filters?.toDate) {
            where.transactionDate = {};
            if (filters.fromDate) {
                where.transactionDate.gte = filters.fromDate;
            }
            if (filters.toDate) {
                where.transactionDate.lte = filters.toDate;
            }
        }

        const page = filters?.page || 1;
        const pageSize = filters?.pageSize || 50;
        const skip = (page - 1) * pageSize;

        const [transactions, total] = await Promise.all([
            prisma.fundTransaction.findMany({
                where,
                include: {
                    CreatedBy: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: { transactionDate: 'desc' },
                skip,
                take: pageSize,
            }),
            prisma.fundTransaction.count({ where }),
        ]);

        return {
            data: transactions,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async getRecentTransactions(limit: number = 10, branchId?: string) {
        const where: Prisma.FundTransactionWhereInput = {};

        if (branchId) {
            where.FundSource = {
                OR: [
                    { branchId },
                    { branchId: null },
                ],
            };
        }

        return await prisma.fundTransaction.findMany({
            where,
            include: {
                CreatedBy: { select: { id: true, firstName: true, lastName: true } },
                FundSource: { select: { id: true, name: true, code: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}

export class FundTransferRepository {
    async create(data: Prisma.FundTransferCreateInput, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;
        return await client.fundTransfer.create({
            data,
            include: {
                FromFundSource: { select: { id: true, name: true, code: true } },
                ToFundSource: { select: { id: true, name: true, code: true } },
                CreatedBy: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }

    async findById(id: string) {
        return await prisma.fundTransfer.findUnique({
            where: { id },
            include: {
                FromFundSource: { select: { id: true, name: true, code: true, currentBalance: true } },
                ToFundSource: { select: { id: true, name: true, code: true, currentBalance: true } },
                CreatedBy: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }

    async findAll(filters?: {
        fromFundSourceId?: string;
        toFundSourceId?: string;
        status?: string;
        fromDate?: Date;
        toDate?: Date;
        page?: number;
        pageSize?: number;
    }) {
        const where: Prisma.FundTransferWhereInput = {};

        if (filters?.fromFundSourceId) {
            where.fromFundSourceId = filters.fromFundSourceId;
        }

        if (filters?.toFundSourceId) {
            where.toFundSourceId = filters.toFundSourceId;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.fromDate || filters?.toDate) {
            where.transferDate = {};
            if (filters.fromDate) {
                where.transferDate.gte = filters.fromDate;
            }
            if (filters.toDate) {
                where.transferDate.lte = filters.toDate;
            }
        }

        const page = filters?.page || 1;
        const pageSize = filters?.pageSize || 50;
        const skip = (page - 1) * pageSize;

        const [transfers, total] = await Promise.all([
            prisma.fundTransfer.findMany({
                where,
                include: {
                    FromFundSource: { select: { id: true, name: true, code: true } },
                    ToFundSource: { select: { id: true, name: true, code: true } },
                    CreatedBy: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: { transferDate: 'desc' },
                skip,
                take: pageSize,
            }),
            prisma.fundTransfer.count({ where }),
        ]);

        return {
            data: transfers,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async getNextTransferNumber(): Promise<string> {
        const today = new Date();
        const datePrefix = `TRF-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

        const lastTransfer = await prisma.fundTransfer.findFirst({
            where: {
                transferNumber: { startsWith: datePrefix },
            },
            orderBy: { transferNumber: 'desc' },
        });

        if (lastTransfer) {
            const lastNumber = parseInt(lastTransfer.transferNumber.split('-').pop() || '0', 10);
            return `${datePrefix}-${String(lastNumber + 1).padStart(4, '0')}`;
        }

        return `${datePrefix}-0001`;
    }
}

export const fundSourceRepository = new FundSourceRepository();
export const fundTransactionRepository = new FundTransactionRepository();
export const fundTransferRepository = new FundTransferRepository();
