import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderService } from '@/services/purchase-order.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';
import { PurchaseOrderFilters } from '@/types/purchase-order.types';
import { extractToken } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

// GET /api/purchase-orders - Fetch all purchase orders with optional filters
export async function GET(request: NextRequest) {
  try {
    console.log('=== PURCHASE ORDERS GET REQUEST START ===');
    const searchParams = request.nextUrl.searchParams;

    const filters: PurchaseOrderFilters = {
      status: searchParams.get('status') as any || undefined,
      branchId: searchParams.get('branchId') || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    };

    console.log('Purchase order filters:', JSON.stringify(filters, null, 2));
    console.log('Calling purchaseOrderService.getAllPurchaseOrders...');
    const purchaseOrders = await purchaseOrderService.getAllPurchaseOrders(filters);
    console.log('Purchase orders retrieved successfully, count:', purchaseOrders.length);
    return NextResponse.json({ success: true, data: purchaseOrders });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

// POST /api/purchase-orders - Create a new purchase order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Convert date string to Date object
    if (body.expectedDeliveryDate) {
      body.expectedDeliveryDate = new Date(body.expectedDeliveryDate);
    }

    // Authenticate User for Auditing
    const token = extractToken(request);
    let userId: string | undefined;
    if (token) {
      const payload = authService.verifyToken(token);
      userId = payload?.userId;
    }

    const purchaseOrder = await purchaseOrderService.createPurchaseOrder(body, userId);

    return NextResponse.json(
      { success: true, data: purchaseOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating purchase order:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create purchase order', details: (error as any)?.message },
      { status: 500 }
    );
  }
}
