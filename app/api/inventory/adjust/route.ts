import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { approvalService } from '@/services/approval.service';
import { authService } from '@/services/auth.service';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

interface AdjustStockRequest {
  productId: string;
  warehouseId: string;
  newQuantity: number;
  reason: string;
}

// POST /api/inventory/adjust - Adjust stock quantity
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate User
    let token = request.cookies.get('auth-token')?.value;

    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const payload = authService.verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body: AdjustStockRequest = await request.json();

    // 2. Check Approval Rules
    const settings = await prisma.companySettings.findFirst();
    const approvalRules = settings?.approvalRules ? JSON.parse(settings.approvalRules) : {};

    if (approvalRules.inventoryAdjustment) {
      // Create Approval Request
      await approvalService.createRequest(
        'INVENTORY_ADJUSTMENT',
        body.productId || (body as any).inventoryId, // Handle both just in case
        body,
        payload.userId,
        body.reason
      );

      return NextResponse.json(
        { success: true, message: 'Approval request sent successfully' },
        { status: 200 }
      );
    }

    // 3. Proceed if no approval needed
    await inventoryService.adjustStock(body);

    return NextResponse.json(
      { success: true, message: 'Stock adjusted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error adjusting stock:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}
