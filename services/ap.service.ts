import { apRepository } from '@/repositories/ap.repository';
import { CreateAPInput, RecordAPPaymentInput, APFilters, APAgingReport, APAgingBucket } from '@/types/ap.types';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';

export class APService {
  async createAP(data: CreateAPInput) {
    const balance = new Decimal(data.totalAmount);

    return await apRepository.create({
      id: randomUUID(),
      Branch: { connect: { id: data.branchId } },
      Supplier: { connect: { id: data.supplierId } },
      purchaseOrderId: data.purchaseOrderId,
      totalAmount: data.totalAmount,
      paidAmount: 0,
      balance: balance.toNumber(),
      dueDate: data.dueDate,
      status: 'pending',
    });
  }

  calculateDueDate(paymentTerms: string): Date {
    const dueDate = new Date();
    
    switch (paymentTerms) {
      case 'Net 15':
        dueDate.setDate(dueDate.getDate() + 15);
        break;
      case 'Net 30':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'Net 60':
        dueDate.setDate(dueDate.getDate() + 60);
        break;
      case 'COD':
        // Due immediately
        break;
    }
    
    return dueDate;
  }

  async recordPayment(data: RecordAPPaymentInput) {
    return await prisma.$transaction(async (tx) => {
      const ap = await tx.accountsPayable.findUnique({
        where: { id: data.apId },
      });

      if (!ap) {
        throw new Error('AP record not found');
      }

      if (data.amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      if (new Decimal(data.amount).greaterThan(ap.balance)) {
        throw new Error('Payment amount exceeds outstanding balance');
      }

      await tx.aPPayment.create({
        data: {
          id: randomUUID(),
          AccountsPayable: { connect: { id: data.apId } },
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          paymentDate: data.paymentDate,
        },
      });

      const newPaidAmount = new Decimal(ap.paidAmount).plus(data.amount);
      const newBalance = new Decimal(ap.totalAmount).minus(newPaidAmount);
      
      let newStatus = ap.status;
      if (newBalance.equals(0)) {
        newStatus = 'paid';
      } else if (newBalance.lessThan(ap.totalAmount)) {
        newStatus = 'partial';
      }

      const today = new Date();
      if (ap.dueDate < today && newBalance.greaterThan(0)) {
        newStatus = 'overdue';
      }

      return await tx.accountsPayable.update({
        where: { id: data.apId },
        data: {
          paidAmount: newPaidAmount.toNumber(),
          balance: newBalance.toNumber(),
          status: newStatus,
        },
        include: {
          Branch: true,
          Supplier: true,
          APPayment: true,
        },
      });
    });
  }

  async getAPById(id: string) {
    return await apRepository.findById(id);
  }

  async getAllAP(filters?: APFilters) {
    return await apRepository.findAll(filters);
  }

  async deleteAP(id: string) {
    return await apRepository.delete(id);
  }

  async getAgingReport(branchId?: string): Promise<APAgingReport> {
    const records = await apRepository.getAgingReport(branchId);
    const today = new Date();

    const buckets: APAgingBucket[] = [
      { bucket: '0-30', count: 0, totalAmount: new Decimal(0) },
      { bucket: '31-60', count: 0, totalAmount: new Decimal(0) },
      { bucket: '61-90', count: 0, totalAmount: new Decimal(0) },
      { bucket: '90+', count: 0, totalAmount: new Decimal(0) },
    ];

    const supplierMap = new Map<string, any>();

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

      if (!supplierMap.has(record.supplier.companyName)) {
        supplierMap.set(record.supplier.companyName, {
          supplierName: record.supplier.companyName,
          total: new Decimal(0),
          aging: [
            { bucket: '0-30', count: 0, totalAmount: new Decimal(0) },
            { bucket: '31-60', count: 0, totalAmount: new Decimal(0) },
            { bucket: '61-90', count: 0, totalAmount: new Decimal(0) },
            { bucket: '90+', count: 0, totalAmount: new Decimal(0) },
          ] as APAgingBucket[],
        });
      }

      const supplier = supplierMap.get(record.supplier.companyName);
      supplier.total = new Decimal(supplier.total).plus(record.balance);
      supplier.aging[bucketIndex].count++;
      supplier.aging[bucketIndex].totalAmount = new Decimal(
        supplier.aging[bucketIndex].totalAmount
      ).plus(record.balance);
    }

    const totalOutstanding = buckets.reduce(
      (sum, bucket) => sum.plus(bucket.totalAmount),
      new Decimal(0)
    );

    return {
      buckets,
      totalOutstanding,
      bySupplier: Array.from(supplierMap.values()),
    };
  }

  async getSummary(branchId?: string) {
    return await apRepository.getSummary(branchId);
  }
}

export const apService = new APService();
