import { arRepository } from '@/repositories/ar.repository';
import { CreateARInput, RecordARPaymentInput, ARFilters, ARAgingReport, ARAgingBucket } from '@/types/ar.types';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class ARService {
  async createAR(data: CreateARInput) {
    const balance = new Decimal(data.totalAmount);

    return await arRepository.create({
      branch: { connect: { id: data.branchId } },
      customer: data.customerId ? { connect: { id: data.customerId } } : undefined,
      customerName: data.customerName,
      salesOrderId: data.salesOrderId,
      totalAmount: data.totalAmount,
      paidAmount: 0,
      balance,
      dueDate: data.dueDate,
      status: 'pending',
    });
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

      if (new Decimal(data.amount).greaterThan(ar.balance)) {
        throw new Error('Payment amount exceeds outstanding balance');
      }

      // Create payment record
      await tx.aRPayment.create({
        data: {
          ar: { connect: { id: data.arId } },
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          paymentDate: data.paymentDate,
        },
      });

      // Update AR record
      const newPaidAmount = new Decimal(ar.paidAmount).plus(data.amount);
      const newBalance = new Decimal(ar.totalAmount).minus(newPaidAmount);
      
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
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus,
        },
        include: {
          branch: true,
          payments: true,
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
      { bucket: '0-30', count: 0, totalAmount: new Decimal(0) },
      { bucket: '31-60', count: 0, totalAmount: new Decimal(0) },
      { bucket: '61-90', count: 0, totalAmount: new Decimal(0) },
      { bucket: '90+', count: 0, totalAmount: new Decimal(0) },
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
      buckets[bucketIndex].totalAmount = new Decimal(buckets[bucketIndex].totalAmount).plus(
        record.balance
      );

      // Group by customer
      if (!customerMap.has(record.customerName)) {
        customerMap.set(record.customerName, {
          customerName: record.customerName,
          total: new Decimal(0),
          aging: [
            { bucket: '0-30', count: 0, totalAmount: new Decimal(0) },
            { bucket: '31-60', count: 0, totalAmount: new Decimal(0) },
            { bucket: '61-90', count: 0, totalAmount: new Decimal(0) },
            { bucket: '90+', count: 0, totalAmount: new Decimal(0) },
          ] as ARAgingBucket[],
        });
      }

      const customer = customerMap.get(record.customerName);
      customer.total = new Decimal(customer.total).plus(record.balance);
      customer.aging[bucketIndex].count++;
      customer.aging[bucketIndex].totalAmount = new Decimal(
        customer.aging[bucketIndex].totalAmount
      ).plus(record.balance);
    }

    const totalOutstanding = buckets.reduce(
      (sum, bucket) => sum.plus(bucket.totalAmount),
      new Decimal(0)
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
}

export const arService = new ARService();
