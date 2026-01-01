import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/auth.middleware';
import { withPermission } from '@/middleware/permission.middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (authRequest) => {
    return withPermission(authRequest, 'REPORT', 'READ', async (permissionRequest) => {
      try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const branchId = searchParams.get('branchId');

        const whereClause: any = {};
        if (startDate || endDate) {
          whereClause.createdAt = {};
          if (startDate) whereClause.createdAt.gte = new Date(startDate);
          if (endDate) whereClause.createdAt.lte = new Date(endDate);
        }
        if (branchId) whereClause.branchId = branchId;

        const promotionUsage = await prisma.promotionUsage.findMany({
          where: whereClause,
          include: {
            promotion: true,
            customer: true,
            branch: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        const summaryStats = await prisma.promotionUsage.aggregate({
          where: whereClause,
          _sum: {
            discountAmount: true,
            originalAmount: true,
            finalAmount: true,
          },
          _avg: {
            discountAmount: true,
            originalAmount: true,
          },
          _count: {
            id: true,
          },
        });

        return NextResponse.json({
          success: true,
          data: promotionUsage,
          summaryStats,
          filters: { startDate, endDate, branchId },
        });
      } catch (error) {
        console.error('Promotion analytics error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to generate promotion analytics' },
          { status: 500 }
        );
      }
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (authRequest) => {
    return withPermission(authRequest, 'REPORT', 'CREATE', async (permissionRequest) => {
      try {
        const body = await request.json();
        const { promotionId, customerId, branchId, originalAmount, discountAmount, finalAmount, receiptNumber } = body;

        if (!promotionId || !customerId || !branchId || !originalAmount || !discountAmount || !finalAmount || !receiptNumber) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const promotionUsage = await prisma.promotionUsage.create({
          data: {
            promotionId,
            customerId,
            branchId,
            originalAmount,
            discountAmount,
            finalAmount,
            receiptNumber,
            status: 'USED',
          },
          include: {
            promotion: true,
            customer: true,
            branch: true,
          },
        });

        return NextResponse.json({
          success: true,
          data: promotionUsage,
        });
      } catch (error) {
        console.error('Create promotion usage error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create promotion usage record' },
          { status: 500 }
        );
      }
    });
  });
}