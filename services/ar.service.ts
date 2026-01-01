import { arRepository } from '@/repositories/ar.repository';
import { CreateARInput, RecordARPaymentInput, ARFilters, ARAgingReport, ARAgingBucket } from '@/types/ar.types';
import { prisma, Prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export class ARService {
  async createAR(data: CreateARInput) {
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

      if (new Prisma.Decimal(data.amount).greaterThan(ar.balance)) {
        throw new Error('Payment amount exceeds outstanding balance');
      }

      // Create payment record
      await tx.aRPayment.create({
        data: {
          id: randomUUID(),
          AccountsReceivable: { connect: { id: data.arId } },
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          paymentDate: data.paymentDate,
        },
      });

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
}

export const arService = new ARService();
