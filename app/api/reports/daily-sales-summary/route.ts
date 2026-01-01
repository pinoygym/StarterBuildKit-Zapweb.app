import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/client';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId') || undefined;
        const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined;
        const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined;

        const where: any = {};
        if (branchId) where.branchId = branchId;
        if (fromDate || toDate) {
            where.createdAt = {};
            if (fromDate) where.createdAt.gte = fromDate;
            if (toDate) where.createdAt.lte = toDate;
        }

        const sales = await prisma.pOSSale.findMany({
            where,
            include: {
                POSSaleItem: true,
                Branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Group sales by date
        const dailyMap = new Map<string, {
            branchId: string;
            branchName: string;
            totalSales: Decimal;
            totalTransactions: number;
            cashSales: Decimal;
            cardSales: Decimal;
            digitalSales: Decimal;
            creditSales: Decimal;
            totalTax: Decimal;
            totalDiscount: Decimal;
            grossProfit: Decimal;
        }>();

        for (const sale of sales) {
            const dateKey = sale.createdAt.toISOString().split('T')[0];
            const existing = dailyMap.get(dateKey);

            const saleCOGS = sale.POSSaleItem.reduce(
                (sum, item) => sum.plus(item.costOfGoodsSold),
                new Decimal(0)
            );
            const grossProfit = new Decimal(sale.totalAmount).minus(saleCOGS);

            // Categorize by payment method
            const paymentAmount = new Decimal(sale.totalAmount);
            let cashSales = new Decimal(0);
            let cardSales = new Decimal(0);
            let digitalSales = new Decimal(0);
            let creditSales = new Decimal(0);

            switch (sale.paymentMethod?.toLowerCase()) {
                case 'cash':
                    cashSales = paymentAmount;
                    break;
                case 'card':
                case 'credit_card':
                case 'debit_card':
                    cardSales = paymentAmount;
                    break;
                case 'digital':
                case 'gcash':
                case 'paymaya':
                case 'online':
                    digitalSales = paymentAmount;
                    break;
                case 'credit':
                case 'ar':
                    creditSales = paymentAmount;
                    break;
                default:
                    cashSales = paymentAmount; // Default to cash
            }

            if (existing) {
                existing.totalSales = existing.totalSales.plus(sale.totalAmount);
                existing.totalTransactions++;
                existing.cashSales = existing.cashSales.plus(cashSales);
                existing.cardSales = existing.cardSales.plus(cardSales);
                existing.digitalSales = existing.digitalSales.plus(digitalSales);
                existing.creditSales = existing.creditSales.plus(creditSales);
                existing.totalTax = existing.totalTax.plus(sale.tax || 0);
                existing.totalDiscount = existing.totalDiscount.plus(sale.discount || 0);
                existing.grossProfit = existing.grossProfit.plus(grossProfit);
            } else {
                dailyMap.set(dateKey, {
                    branchId: sale.branchId,
                    branchName: sale.Branch.name,
                    totalSales: new Decimal(sale.totalAmount),
                    totalTransactions: 1,
                    cashSales,
                    cardSales,
                    digitalSales,
                    creditSales,
                    totalTax: new Decimal(sale.tax || 0),
                    totalDiscount: new Decimal(sale.discount || 0),
                    grossProfit,
                });
            }
        }

        // Convert to array format
        const report = Array.from(dailyMap.entries()).map(([date, data]) => ({
            id: `${data.branchId}-${date}`,
            branchId: data.branchId,
            branchName: data.branchName,
            date: new Date(date),
            totalSales: Number(data.totalSales),
            totalTransactions: data.totalTransactions,
            averageTransaction: data.totalTransactions > 0
                ? Number(data.totalSales.dividedBy(data.totalTransactions))
                : 0,
            cashSales: Number(data.cashSales),
            cardSales: Number(data.cardSales),
            digitalSales: Number(data.digitalSales),
            creditSales: Number(data.creditSales),
            totalTax: Number(data.totalTax),
            totalDiscount: Number(data.totalDiscount),
            grossProfit: Number(data.grossProfit),
            createdAt: new Date(date),
        }));

        return NextResponse.json({ success: true, data: report });
    } catch (error: any) {
        console.error('Error generating daily sales summary:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate report' },
            { status: 500 }
        );
    }
}
