import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { purchaseOrderService } from '@/services/purchase-order.service';
import { AppError } from '@/lib/errors';

import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';

export const dynamic = 'force-dynamic';

// GET /api/purchase-orders/[id] - Fetch single purchase order with items
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const purchaseOrder = await purchaseOrderService.getPurchaseOrderById(id);
    return Response.json({ success: true, data: purchaseOrder });
  } catch (error) {
    console.error('Error fetching purchase order:', error);

    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to fetch purchase order' },
      { status: 500 }
    );
  }
}

// PUT /api/purchase-orders/[id] - Update purchase order
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    return Response.json({ success: true, data: purchaseOrder });
  } catch (error) {
    console.error('Error updating purchase order:', error);

    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to update purchase order' },
      { status: 500 }
    );
  }
}
