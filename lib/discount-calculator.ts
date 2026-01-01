import { POSSaleItemInput } from '@/types/pos.types';

export interface DiscountCalculation {
  itemDiscountsTotal: number;
  transactionDiscount: number;
  totalDiscount: number;
  subtotalAfterDiscount: number;
}

export interface VATCalculation {
  vatAmount: number;
  finalTotal: number;
}

export interface CompanyVATSettings {
  vatEnabled: boolean;
  vatRate: number;
  taxInclusive: boolean;
}

/**
 * Calculate item-level discount
 */
export function calculateItemDiscount(
  originalPrice: number,
  discountType?: 'percentage' | 'fixed',
  discountValue?: number
): number {
  if (!discountType || !discountValue || discountValue <= 0) {
    return 0;
  }

  if (discountType === 'percentage') {
    // Percentage discount: price × (discount% / 100)
    return originalPrice * (discountValue / 100);
  } else {
    // Fixed discount: directly use the discount amount
    return Math.min(discountValue, originalPrice); // Cannot exceed price
  }
}

/**
 * Calculate transaction-level discount
 */
export function calculateTransactionDiscount(
  subtotal: number,
  discountType?: 'percentage' | 'fixed',
  discountValue?: number
): number {
  if (!discountType || !discountValue || discountValue <= 0) {
    return 0;
  }

  if (discountType === 'percentage') {
    // Percentage discount: subtotal × (discount% / 100)
    return subtotal * (discountValue / 100);
  } else {
    // Fixed discount: directly use the discount amount
    return Math.min(discountValue, subtotal); // Cannot exceed subtotal
  }
}

/**
 * Calculate total discounts for a sale
 */
export function calculateTotalDiscounts(
  items: POSSaleItemInput[],
  transactionDiscountType?: 'percentage' | 'fixed',
  transactionDiscountValue?: number
): DiscountCalculation {
  // Calculate item-level discounts
  const itemDiscountsTotal = items.reduce((sum, item) => {
    const itemDiscount = item.discount || 0;
    return sum + (itemDiscount * item.quantity);
  }, 0);

  // Calculate subtotal after item discounts
  const subtotalAfterItemDiscounts = items.reduce((sum, item) => {
    return sum + item.subtotal;
  }, 0);

  // Calculate transaction-level discount
  const transactionDiscount = calculateTransactionDiscount(
    subtotalAfterItemDiscounts,
    transactionDiscountType,
    transactionDiscountValue
  );

  // Final subtotal after all discounts
  const subtotalAfterDiscount = subtotalAfterItemDiscounts - transactionDiscount;

  return {
    itemDiscountsTotal,
    transactionDiscount,
    totalDiscount: itemDiscountsTotal + transactionDiscount,
    subtotalAfterDiscount: Math.max(0, subtotalAfterDiscount),
  };
}

/**
 * Calculate VAT based on company settings
 */
export function calculateVAT(
  subtotalAfterDiscount: number,
  settings: CompanyVATSettings
): VATCalculation {
  if (!settings.vatEnabled) {
    return {
      vatAmount: 0,
      finalTotal: subtotalAfterDiscount,
    };
  }

  const vatRate = settings.vatRate / 100; // Convert percentage to decimal

  let vatAmount: number;
  let finalTotal: number;

  if (settings.taxInclusive) {
    // Tax-inclusive: VAT is already included in the price
    // Formula: VAT = (subtotal / (1 + vatRate)) × vatRate
    vatAmount = (subtotalAfterDiscount / (1 + vatRate)) * vatRate;
    finalTotal = subtotalAfterDiscount;
  } else {
    // Tax-exclusive: VAT needs to be added to the price
    // Formula: VAT = subtotal × vatRate
    vatAmount = subtotalAfterDiscount * vatRate;
    finalTotal = subtotalAfterDiscount + vatAmount;
  }

  return {
    vatAmount: parseFloat(vatAmount.toFixed(2)),
    finalTotal: parseFloat(finalTotal.toFixed(2)),
  };
}

/**
 * Validate discount doesn't exceed maximum allowed
 */
export function validateDiscount(
  discountPercentage: number,
  maxDiscountPercentage: number,
  requireApproval: boolean,
  approvalThreshold: number
): {
  isValid: boolean;
  requiresApproval: boolean;
  error?: string;
} {
  if (discountPercentage < 0) {
    return {
      isValid: false,
      requiresApproval: false,
      error: 'Discount cannot be negative',
    };
  }

  if (discountPercentage > maxDiscountPercentage) {
    return {
      isValid: false,
      requiresApproval: false,
      error: `Discount cannot exceed ${maxDiscountPercentage}%`,
    };
  }

  const needsApproval = requireApproval && discountPercentage > approvalThreshold;

  return {
    isValid: true,
    requiresApproval: needsApproval,
  };
}

/**
 * Calculate discount percentage from amount
 */
export function calculateDiscountPercentage(
  originalAmount: number,
  discountAmount: number
): number {
  if (originalAmount === 0) return 0;
  return (discountAmount / originalAmount) * 100;
}
