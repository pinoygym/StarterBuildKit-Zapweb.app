import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/auth.middleware';
import { withPermission } from '@/middleware/permission.middleware';
import { 
  SecurityValidator, 
  ErrorHandler, 
  AuthValidator, 
  RateLimiters,
  DataValidator,
  ValidationError,
  AuthorizationError,
  DataNotFoundError,
  withSecurity
} from '@/lib/report-security';

export async function GET(request: NextRequest) {
  return withAuth(request, async (authRequest) => {
    return withPermission(authRequest, 'REPORT', 'READ', async () => {
      try {
        const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
        RateLimiters.reportGeneration(clientIp);

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const branchId = searchParams.get('branchId');
        const userId = searchParams.get('userId');

        const dateRange = {
          fromDate: startDate ? new Date(startDate) : undefined,
          toDate: endDate ? new Date(endDate) : undefined,
        };

        SecurityValidator.validateReportParams({
          dateRange,
          branchId: branchId || undefined,
          userId: userId || undefined,
        });

        const sanitizedBranchId = branchId ? SecurityValidator.sanitizeInput(branchId) : undefined;
        const sanitizedUserId = userId ? SecurityValidator.sanitizeInput(userId) : undefined;

        const whereClause: any = {};
        if (startDate || endDate) {
          whereClause.createdAt = {};
          if (startDate) whereClause.createdAt.gte = dateRange.fromDate;
          if (endDate) whereClause.createdAt.lte = dateRange.toDate;
        }
        if (sanitizedBranchId) whereClause.branchId = sanitizedBranchId;
        if (sanitizedUserId) whereClause.userId = sanitizedUserId;

        const employeePerformance = await prisma.employeePerformance.findMany({
          where: whereClause,
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                Branch: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        const summaryStats = await prisma.employeePerformance.aggregate({
          where: whereClause,
          _sum: {
            totalSales: true,
            transactionCount: true,
            itemsSold: true,
          },
          _avg: {
            averageTransaction: true,
          },
          _count: {
            id: true,
          },
        });

        const topPerformers = await prisma.employeePerformance.findMany({
          where: whereClause,
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                Branch: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
          orderBy: {
            totalSales: 'desc',
          },
          take: 10,
        });

        const branchPerformance = await prisma.employeePerformance.groupBy({
          by: ['branchId'],
          where: whereClause,
          _sum: {
            totalSales: true,
            transactionCount: true,
            itemsSold: true,
          },
          _avg: {
            averageTransaction: true,
          },
          _count: {
            id: true,
          },
        });

        const branchDetails = await Promise.all(
          branchPerformance.map(async (branch) => {
            const branchInfo = await prisma.branch.findUnique({
              where: { id: branch.branchId },
              select: { id: true, name: true, code: true },
            });
            return {
              ...branch,
              branch: branchInfo,
            };
          })
        );

        if (!employeePerformance || employeePerformance.length === 0) {
          throw new DataNotFoundError('Employee performance data');
        }

        return NextResponse.json({
          success: true,
          data: {
            employeePerformance,
            summaryStats,
            topPerformers,
            branchPerformance: branchDetails,
            filters: {
              startDate,
              endDate,
              branchId: sanitizedBranchId,
              userId: sanitizedUserId,
            },
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Employee performance report error:', error);
        const errorResponse = ErrorHandler.formatErrorResponse(error);
        ErrorHandler.logError(error, {
          endpoint: '/api/reports/employee-performance',
          method: 'GET',
        });
        return NextResponse.json(errorResponse, { status: (error as any).statusCode || 500 });
      }
    });
  });
}

// POST endpoint to create or update employee performance records
export async function POST(request: NextRequest) {
  return withAuth(request, async (authRequest) => {
    return withPermission(authRequest, 'REPORT', 'CREATE', async () => {
      try {
        const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
        RateLimiters.reportGeneration(clientIp);

        const body = await request.json();
        const {
          userId,
          branchId,
          totalSales,
          totalTransactions,
          totalItems,
          averageTransactionValue,
          averageItemsPerTransaction,
          discountAmount,
          refundAmount,
          performanceScore,
          notes,
        } = body;

        if (!userId || !branchId) {
          throw new ValidationError('User ID and Branch ID are required');
        }

        const sanitizedUserId = SecurityValidator.sanitizeInput(userId);
        const sanitizedBranchId = SecurityValidator.sanitizeInput(branchId);

        SecurityValidator.validateReportParams({
          branchId: sanitizedBranchId,
          userId: sanitizedUserId,
        });

        DataValidator.validateRange(totalSales, 0, 10000000, 'Total sales');
        DataValidator.validateRange(totalTransactions, 0, 1000000, 'Total transactions');
        DataValidator.validateRange(totalItems, 0, 10000000, 'Total items');
        DataValidator.validateRange(averageTransactionValue, 0, 1000000, 'Average transaction value');
        DataValidator.validateRange(averageItemsPerTransaction, 0, 1000, 'Average items per transaction');
        DataValidator.validateRange(discountAmount || 0, 0, 1000000, 'Discount amount');
        DataValidator.validateRange(refundAmount || 0, 0, 1000000, 'Refund amount');
        DataValidator.validateRange(performanceScore || 0, 0, 100, 'Performance score');

        const userExists = await prisma.user.findUnique({
          where: { id: sanitizedUserId },
          select: { id: true, branchId: true }
        });

        const branchExists = await prisma.branch.findUnique({
          where: { id: sanitizedBranchId },
          select: { id: true }
        });

        if (!userExists) {
          throw new DataNotFoundError('User');
        }

        if (!branchExists) {
          throw new DataNotFoundError('Branch');
        }

        AuthValidator.validateReportAccess(authRequest.user as any, 'employee', sanitizedBranchId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingRecord = await prisma.employeePerformance.findFirst({
          where: {
            userId: sanitizedUserId,
            branchId: sanitizedBranchId,
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        });

        let performanceRecord;
        if (existingRecord) {
          performanceRecord = await prisma.employeePerformance.update({
            where: { id: existingRecord.id },
            data: {
              totalSales,
              totalTransactions,
              totalItems,
              averageTransactionValue,
              averageItemsPerTransaction,
              discountAmount,
              refundAmount,
              performanceScore,
              notes,
            },
          });
        } else {
          performanceRecord = await prisma.employeePerformance.create({
            data: {
              userId: sanitizedUserId,
              branchId: sanitizedBranchId,
              totalSales,
              totalTransactions,
              totalItems,
              averageTransactionValue,
              averageItemsPerTransaction,
              discountAmount,
              refundAmount,
              performanceScore,
              notes,
            },
          });
        }

        return NextResponse.json({
          success: true,
          data: performanceRecord,
          message: existingRecord ? 'Performance record updated successfully' : 'Performance record created successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Employee performance record creation error:', error);
        const errorResponse = ErrorHandler.formatErrorResponse(error);
        ErrorHandler.logError(error, {
          endpoint: '/api/reports/employee-performance',
          method: 'POST',
        });
        return NextResponse.json(errorResponse, { status: (error as any).statusCode || 500 });
      }
    });
  });
}