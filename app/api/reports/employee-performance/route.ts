import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/auth.middleware';
import {
  SecurityValidator,
  ErrorHandler,
  AuthValidator,
  RateLimiters,
  DataValidator,
  ValidationError,
  DataNotFoundError,
} from '@/lib/report-security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuth(request, async (authRequest) => {
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
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (authRequest) => {
    try {
      const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      RateLimiters.reportGeneration(clientIp);

      const body = await request.json();
      const {
        userId,
        branchId,
        date,
        totalSales,
        transactionCount,
        averageTransaction,
        itemsSold,
        returnsHandled,
        customerSatisfaction,
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
      DataValidator.validateRange(transactionCount, 0, 1000000, 'Transaction count');
      DataValidator.validateRange(itemsSold, 0, 10000000, 'Items sold');
      DataValidator.validateRange(averageTransaction, 0, 1000000, 'Average transaction');
      DataValidator.validateRange(returnsHandled || 0, 0, 100000, 'Returns handled');
      if (customerSatisfaction !== undefined) {
        DataValidator.validateRange(customerSatisfaction, 0, 100, 'Customer satisfaction');
      }

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

      const performanceDate = date ? new Date(date) : new Date();
      performanceDate.setHours(0, 0, 0, 0);

      const existingRecord = await prisma.employeePerformance.findFirst({
        where: {
          userId: sanitizedUserId,
          branchId: sanitizedBranchId,
          date: performanceDate,
        },
      });

      let performanceRecord;
      if (existingRecord) {
        performanceRecord = await prisma.employeePerformance.update({
          where: { id: existingRecord.id },
          data: {
            totalSales,
            transactionCount,
            averageTransaction,
            itemsSold,
            returnsHandled: returnsHandled || 0,
            customerSatisfaction,
          },
        });
      } else {
        performanceRecord = await prisma.employeePerformance.create({
          data: {
            userId: sanitizedUserId,
            branchId: sanitizedBranchId,
            date: performanceDate,
            totalSales,
            transactionCount,
            averageTransaction,
            itemsSold,
            returnsHandled: returnsHandled || 0,
            customerSatisfaction,
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
}