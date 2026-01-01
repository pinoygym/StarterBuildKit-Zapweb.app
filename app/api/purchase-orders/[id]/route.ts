import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderService } from '@/services/purchase-order.service';
import { AppError } from '@/lib/errors';

import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';

// GET /api/purchase-orders/[id] - Fetch single purchase order with items
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const purchaseOrder = await purchaseOrderService.getPurchaseOrderById(id);
    return NextResponse.json({ success: true, data: purchaseOrder });
  } catch (error) {
    console.error('Error fetching purchase order:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase order' },
      { status: 500 }
    );
  }
}

// PUT /api/purchase-orders/[id] - Update purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Convert date string to Date object if provided
    if (body.expectedDeliveryDate) {
      body.expectedDeliveryDate = new Date(body.expectedDeliveryDate);
    }

    // Check if user is Super Admin
    let isSuperAdmin = false;
    const token = request.cookies.get('auth-token')?.value;

    if (token) {
      const payload = authService.verifyToken(token);
      if (payload) {
        const user = await userService.getUserById(payload.userId);
        if (user && user.Role.name === 'Super Admin') {
          isSuperAdmin = true;
        }
      }
    }

    const purchaseOrder = await purchaseOrderService.updatePurchaseOrder(id, body, isSuperAdmin);

    return NextResponse.json({ success: true, data: purchaseOrder });
  } catch (error) {
    console.error('Error updating purchase order:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update purchase order' },
      { status: 500 }
    );
  }
}
