import { prisma } from '@/lib/prisma';

export class DiscountExpenseService {
  /**
   * Create an expense record for customer discounts
   */
  async createDiscountExpense(
    totalDiscount: number,
    receiptNumber: string,
    branchId: string,
    discountReason?: string
  ): Promise<void> {
    // Only create expense if there's actually a discount
    if (totalDiscount <= 0) {
      return;
    }

    // Get the "Customer Discounts" expense category
    const discountCategory = await prisma.expenseCategory.findFirst({
      where: {
        code: 'DISC',
        status: 'active',
      },
    });

    if (!discountCategory) {
      console.warn('Customer Discounts expense category not found. Skipping discount expense creation.');
      return;
    }

    // Create expense record
    await prisma.expense.create({
      data: {
        branchId,
        expenseDate: new Date(),
        category: discountCategory.name,
        amount: totalDiscount,
        description: `Customer Discount - Receipt ${receiptNumber}${discountReason ? ` (${discountReason})` : ''}`,
        paymentMethod: 'NA', // Not applicable for discounts
        vendor: null,
      },
    });
  }
}

export const discountExpenseService = new DiscountExpenseService();
