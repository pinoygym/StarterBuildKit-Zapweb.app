import { arRepository } from '@/repositories/ar.repository';
import { CreateARInput, RecordARPaymentInput, ARFilters, ARAgingReport, ARAgingBucket, RecordBatchPaymentInput, ARPaymentReportFilters, ARPaymentReportResponse, ARPaymentReportItem } from '@/types/ar.types';
import { prisma, Prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { fundSourceService } from '@/services/fund-source.service';

export class ARService {
  async createAR(data: CreateARInput, tx?: any) {
    const balance = new Prisma.Decimal(data.totalAmount);

    return await arRepository.create({
      id: randomUUID(),
      Branch: { connect: { id: data.branchId } },
      Customer: data.customerId ? { connect: { id: data.customerId } } : undefined,
      customerName: data.customerName,
      salesOrderId: data.salesOrderId,
      totalAmount: data.totalAmount,
      paidAmount: 0,
      balance: balance.toNumber(),
      dueDate: data.dueDate,
      status: 'pending',
      updatedAt: new Date(),
    }, tx);
  }

  async recordPayment(data: RecordARPaymentInput) {
    return await prisma.$transaction(async (tx) => {
      // Get AR record
      const ar = await tx.accountsReceivable.findUnique({
        where: { id: data.arId },
      });

      if (!ar) {
        throw new Error('AR record not found');
      }

      // Validate payment amount
      if (data.amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      if (new Prisma.Decimal(data.amount).greaterThan(ar.balance)) {
        throw new Error('Payment amount exceeds outstanding balance');
      }

      const paymentId = randomUUID();

      // Create payment record
      await tx.aRPayment.create({
        data: {
          id: paymentId,
          AccountsReceivable: { connect: { id: data.arId } },
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          paymentDate: data.paymentDate,
          fundSourceId: data.fundSourceId || null,
        },
      });

      // Record fund source deposit if specified
      if (data.fundSourceId && data.createdById) {
        await fundSourceService.recordDeposit(
          data.fundSourceId,
          data.amount,
          `AR Payment from ${ar.customerName}`,
          data.createdById,
          'AR_PAYMENT',
          paymentId,
          tx
        );
      }

      // Update AR record
      const newPaidAmount = new Prisma.Decimal(ar.paidAmount).plus(data.amount);
      const newBalance = new Prisma.Decimal(ar.totalAmount).minus(newPaidAmount);

      let newStatus = ar.status;
      if (newBalance.equals(0)) {
        newStatus = 'paid';
      } else if (newBalance.lessThan(ar.totalAmount)) {
        newStatus = 'partial';
      }

      // Check if overdue
      const today = new Date();
      if (ar.dueDate < today && newBalance.greaterThan(0)) {
        newStatus = 'overdue';
      }

      return await tx.accountsReceivable.update({
        where: { id: data.arId },
        data: {
          paidAmount: newPaidAmount.toNumber(),
          balance: newBalance.toNumber(),
          status: newStatus,
        },
        include: {
          Branch: true,
          ARPayment: true,
        },
      });
    });
  }

  async getARById(id: string) {
    return await arRepository.findById(id);
  }

  async getAllAR(filters?: ARFilters) {
    return await arRepository.findAll(filters);
  }

  async deleteAR(id: string) {
    return await arRepository.delete(id);
  }

  async getAgingReport(branchId?: string): Promise<ARAgingReport> {
    const records = await arRepository.getAgingReport(branchId);
    const today = new Date();

    const buckets: ARAgingBucket[] = [
      { bucket: '0-30', count: 0, totalAmount: new Prisma.Decimal(0) },
      { bucket: '31-60', count: 0, totalAmount: new Prisma.Decimal(0) },
      { bucket: '61-90', count: 0, totalAmount: new Prisma.Decimal(0) },
      { bucket: '90+', count: 0, totalAmount: new Prisma.Decimal(0) },
    ];

    const customerMap = new Map<string, any>();

    for (const record of records) {
      const daysOverdue = Math.floor(
        (today.getTime() - record.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let bucketIndex = 0;
      if (daysOverdue > 90) bucketIndex = 3;
      else if (daysOverdue > 60) bucketIndex = 2;
      else if (daysOverdue > 30) bucketIndex = 1;

      buckets[bucketIndex].count++;
      buckets[bucketIndex].totalAmount = buckets[bucketIndex].totalAmount.plus(
        record.balance
      );

      // Group by customer
      if (!customerMap.has(record.customerName)) {
        customerMap.set(record.customerName, {
          customerName: record.customerName,
          total: new Prisma.Decimal(0),
          aging: [
            { bucket: '0-30', count: 0, totalAmount: new Prisma.Decimal(0) },
            { bucket: '31-60', count: 0, totalAmount: new Prisma.Decimal(0) },
            { bucket: '61-90', count: 0, totalAmount: new Prisma.Decimal(0) },
            { bucket: '90+', count: 0, totalAmount: new Prisma.Decimal(0) },
          ] as ARAgingBucket[],
        });
      }

      const customer = customerMap.get(record.customerName);
      customer.total = customer.total.plus(record.balance);
      customer.aging[bucketIndex].count++;
      customer.aging[bucketIndex].totalAmount =
        customer.aging[bucketIndex].totalAmount.plus(record.balance);
    }

    const totalOutstanding = buckets.reduce(
      (sum, bucket) => sum.plus(bucket.totalAmount),
      new Prisma.Decimal(0)
    );

    return {
      buckets,
      totalOutstanding,
      byCustomer: Array.from(customerMap.values()),
    };
  }

  async getSummary(branchId?: string) {
    return await arRepository.getSummary(branchId);
  }

  async recordBatchPayment(data: RecordBatchPaymentInput) {
    // Validate allocations
    if (!data.allocations || data.allocations.length === 0) {
      throw new Error('At least one allocation is required');
    }

    // Validate total amount matches allocations
    const totalAllocated = data.allocations.reduce((sum: number, item: any) => sum + item.amount, 0);

    // Allow slight float mismatch
    if (Math.abs(data.totalAmount - totalAllocated) > 0.01) {
      throw new Error(`Total allocated amount must equal total payment amount`);
    }

    return await prisma.$transaction(async (tx) => {
      const updatedRecords = [];

      for (const allocation of data.allocations) {
        // Reuse logic or duplicate safe logic for transaction context
        const ar = await tx.accountsReceivable.findUnique({
          where: { id: allocation.arId },
        });

        if (!ar) {
          throw new Error(`AR record ${allocation.arId} not found`);
        }

        if (allocation.amount <= 0) {
          continue; // Skip zero allocations
        }

        const currentBalance = new Prisma.Decimal(ar.balance);
        const paymentAmount = new Prisma.Decimal(allocation.amount);

        if (paymentAmount.greaterThan(currentBalance)) {
          throw new Error(`Allocation for ${ar.salesOrderId || ar.id} exceeds balance`);
        }

        // Create payment record
        await tx.aRPayment.create({
          data: {
            id: randomUUID(),
            AccountsReceivable: { connect: { id: allocation.arId } },
            amount: allocation.amount,
            paymentMethod: data.paymentMethod,
            referenceNumber: data.referenceNumber,
            paymentDate: data.paymentDate,
          },
        });

        // Update AR
        const newPaidAmount = new Prisma.Decimal(ar.paidAmount).plus(paymentAmount);
        const newBalance = currentBalance.minus(paymentAmount);

        let newStatus = ar.status;
        if (newBalance.equals(0)) {
          newStatus = 'paid';
        } else {
          newStatus = 'partial';
        }

        const updatedAR = await tx.accountsReceivable.update({
          where: { id: allocation.arId },
          data: {
            paidAmount: newPaidAmount.toNumber(),
            balance: newBalance.toNumber(),
            status: newStatus,
          },
        });

        updatedRecords.push(updatedAR);
      }

      return updatedRecords;
    });
  }

  async getPaymentsReport(filters?: ARPaymentReportFilters): Promise<ARPaymentReportResponse> {
    // Build where clause for ARPayment
    const where: any = {};

    if (filters?.fromDate || filters?.toDate) {
      where.paymentDate = {};
      if (filters.fromDate) {
        where.paymentDate.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.paymentDate.lte = filters.toDate;
      }
    }

    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters?.referenceNumber) {
      where.referenceNumber = {
        contains: filters.referenceNumber,
        mode: 'insensitive' as Prisma.QueryMode,
      };
    }

    // Build where clause for AccountsReceivable (nested)
    const arWhere: any = {};

    if (filters?.branchId) {
      arWhere.branchId = filters.branchId;
    }

    if (filters?.customerId) {
      arWhere.customerId = filters.customerId;
    }

    if (filters?.customerName) {
      arWhere.customerName = {
        contains: filters.customerName,
        mode: 'insensitive' as Prisma.QueryMode,
      };
    }

    if (Object.keys(arWhere).length > 0) {
      where.AccountsReceivable = arWhere;
    }

    // Fetch payments with related data
    const payments = await prisma.aRPayment.findMany({
      where,
      include: {
        AccountsReceivable: {
          include: {
            Branch: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    // Transform to report items
    const reportItems: ARPaymentReportItem[] = payments.map((payment) => ({
      id: payment.id,
      referenceNumber: payment.referenceNumber,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      customerName: payment.AccountsReceivable.customerName,
      branchName: payment.AccountsReceivable.Branch.name,
      branchCode: payment.AccountsReceivable.Branch.code,
      arId: payment.arId,
      salesOrderId: payment.AccountsReceivable.salesOrderId,
    }));

    // Calculate summary statistics
    const totalAmount = reportItems.reduce((sum, item) => sum + item.amount, 0);
    const totalPayments = reportItems.length;

    // Group by payment method
    const methodMap = new Map<string, { count: number; amount: number }>();
    reportItems.forEach((item) => {
      const existing = methodMap.get(item.paymentMethod) || { count: 0, amount: 0 };
      methodMap.set(item.paymentMethod, {
        count: existing.count + 1,
        amount: existing.amount + item.amount,
      });
    });

    const byPaymentMethod = Array.from(methodMap.entries()).map(([method, stats]) => ({
      method,
      count: stats.count,
      amount: stats.amount,
    }));

    // Group by branch
    const branchMap = new Map<string, { count: number; amount: number }>();
    reportItems.forEach((item) => {
      const existing = branchMap.get(item.branchName) || { count: 0, amount: 0 };
      branchMap.set(item.branchName, {
        count: existing.count + 1,
        amount: existing.amount + item.amount,
      });
    });

    const byBranch = Array.from(branchMap.entries()).map(([branchName, stats]) => ({
      branchName,
      count: stats.count,
      amount: stats.amount,
    }));

    return {
      payments: reportItems,
      summary: {
        totalAmount,
        totalPayments,
        byPaymentMethod,
        byBranch,
      },
    };
  }
}

export const arService = new ARService();
