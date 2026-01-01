import { NextRequest, NextResponse } from 'next/server';
import { arService } from '@/services/ar.service';
import { ARPaymentReportFilters } from '@/types/ar.types';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // Parse filters from query parameters
        const filters: ARPaymentReportFilters = {};

        const branchId = searchParams.get('branchId');
        if (branchId) {
            filters.branchId = branchId;
        }

        const customerId = searchParams.get('customerId');
        if (customerId) {
            filters.customerId = customerId;
        }

        const customerName = searchParams.get('customerName');
        if (customerName) {
            filters.customerName = customerName;
        }

        const fromDate = searchParams.get('fromDate');
        if (fromDate) {
            filters.fromDate = new Date(fromDate);
        }

        const toDate = searchParams.get('toDate');
        if (toDate) {
            filters.toDate = new Date(toDate);
        }

        const paymentMethod = searchParams.get('paymentMethod');
        if (paymentMethod) {
            filters.paymentMethod = paymentMethod;
        }

        const referenceNumber = searchParams.get('referenceNumber');
        if (referenceNumber) {
            filters.referenceNumber = referenceNumber;
        }

        // Fetch report data
        const report = await arService.getPaymentsReport(filters);

        return NextResponse.json(report);
    } catch (error) {
        console.error('Error fetching AR payments report:', error);
        return NextResponse.json(
            { error: 'Failed to fetch AR payments report' },
            { status: 500 }
        );
    }
}
