import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export interface SalesAgentPerformanceSummary {
    agentId: string;
    agentName: string;
    agentCode: string;
    totalSales: number;
    transactionCount: number;
    averageSaleValue: number;
}

export interface SalesAgentDetailedTransaction {
    id: string;
    receiptNumber: string;
    date: Date;
    totalAmount: number;
    itemsCount: number;
    paymentMethod: string;
    customerName?: string;
}

export class SalesAgentReportService {
    async getPerformanceSummary(
        startDate?: Date,
        endDate?: Date,
        branchId?: string
    ): Promise<SalesAgentPerformanceSummary[]> {
        const where: any = {
            salesAgentId: { not: null }, // Only sales with an agent
        };

        if (startDate) {
            where.createdAt = { ...where.createdAt, gte: startOfDay(startDate) };
        }
        if (endDate) {
            where.createdAt = { ...where.createdAt, lte: endOfDay(endDate) };
        }
        if (branchId) {
            where.branchId = branchId;
        }

        // Group by sales agent
        const sales = await prisma.pOSSale.groupBy({
            by: ['salesAgentId'],
            where,
            _sum: {
                totalAmount: true,
            },
            _count: {
                id: true,
            },
        });

        // Fetch agent details
        const agentIds = sales.map((s) => s.salesAgentId).filter((id): id is string => id !== null);
        const agents = await prisma.salesAgent.findMany({
            where: { id: { in: agentIds } },
            select: { id: true, name: true, code: true },
        });

        const agentMap = new Map(agents.map((a) => [a.id, a]));

        // Combine data
        const summary: SalesAgentPerformanceSummary[] = sales.map((s) => {
            const agent = agentMap.get(s.salesAgentId!);
            const totalSales = s._sum.totalAmount || 0;
            const transactionCount = s._count.id || 0;
            const averageSaleValue = transactionCount > 0 ? totalSales / transactionCount : 0;

            return {
                agentId: s.salesAgentId!,
                agentName: agent?.name || 'Unknown Agent',
                agentCode: agent?.code || 'N/A',
                totalSales,
                transactionCount,
                averageSaleValue,
            };
        });

        return summary.sort((a, b) => b.totalSales - a.totalSales);
    }

    async getDetailedReport(
        agentId: string,
        startDate?: Date,
        endDate?: Date,
        branchId?: string
    ): Promise<SalesAgentDetailedTransaction[]> {
        const where: any = {
            salesAgentId: agentId,
        };

        if (startDate) {
            where.createdAt = { ...where.createdAt, gte: startOfDay(startDate) };
        }
        if (endDate) {
            where.createdAt = { ...where.createdAt, lte: endOfDay(endDate) };
        }
        if (branchId) {
            where.branchId = branchId;
        }

        const sales = await prisma.pOSSale.findMany({
            where,
            select: {
                id: true,
                receiptNumber: true,
                createdAt: true,
                totalAmount: true,
                paymentMethod: true,
                Customer: {
                    select: {
                        companyName: true,
                        contactPerson: true,
                    },
                },
                _count: {
                    select: { POSSaleItem: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return (sales as any[]).map((s) => ({
            id: s.id,
            receiptNumber: s.receiptNumber,
            date: s.createdAt,
            totalAmount: s.totalAmount,
            itemsCount: s._count.POSSaleItem,
            paymentMethod: s.paymentMethod,
            customerName: s.Customer?.companyName || s.Customer?.contactPerson || 'Walk-in',
        }));
    }
}

export const salesAgentReportService = new SalesAgentReportService();
