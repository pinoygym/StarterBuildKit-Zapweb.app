import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId') || undefined;
        const branchId = searchParams.get('branchId') || undefined;
        const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined;
        const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined;

        // Query the CustomerPurchaseHistory table directly
        const where: any = {};
        if (customerId) where.customerId = customerId;
        if (branchId) where.branchId = branchId;
        if (fromDate || toDate) {
            where.purchaseDate = {};
            if (fromDate) where.purchaseDate.gte = fromDate;
            if (toDate) where.purchaseDate.lte = toDate;
        }

        const history = await prisma.customerPurchaseHistory.findMany({
            where,
            include: {
                Customer: {
                    select: {
                        id: true,
                        contactPerson: true,
                        email: true,
                        phone: true,
                    },
                },
                Branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                POSSale: {
                    select: {
                        id: true,
                        receiptNumber: true,
                    },
                },
            },
            orderBy: { purchaseDate: 'desc' },
        });

        const report = history.map((item) => ({
            id: item.id,
            customerId: item.customerId,
            customerName: item.Customer.contactPerson,
            customerEmail: item.Customer.email,
            customerPhone: item.Customer.phone,
            saleId: item.saleId,
            receiptNumber: item.POSSale.receiptNumber,
            branchId: item.branchId,
            branchName: item.Branch.name,
            totalAmount: item.totalAmount,
            itemsCount: item.itemsCount,
            paymentMethod: item.paymentMethod,
            purchaseDate: item.purchaseDate,
            loyaltyPointsEarned: item.loyaltyPointsEarned,
            createdAt: item.createdAt,
        }));

        return NextResponse.json({ success: true, data: report });
    } catch (error: any) {
        console.error('Error generating customer purchase history:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate report' },
            { status: 500 }
        );
    }
}
