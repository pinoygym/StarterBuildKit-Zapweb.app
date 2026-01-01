import { z } from 'zod';

/**
 * Report filters validation schema
 */
export const reportFiltersSchema = z.object({
  branchId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  category: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    // If both dates are provided, fromDate must be before toDate
    if (data.fromDate && data.toDate) {
      return data.fromDate <= data.toDate;
    }
    return true;
  },
  {
    message: 'From date must be before or equal to to date',
    path: ['fromDate'],
  }
);

/**
 * Best selling products limit validation
 */
export const bestSellingProductsSchema = z.object({
  filters: reportFiltersSchema.optional(),
  limit: z.number().int().positive().max(100).default(10),
});

/**
 * Balance sheet filters validation
 */
export const balanceSheetFiltersSchema = z.object({
  branchId: z.string().uuid().optional(),
});

export type ReportFilters = z.infer<typeof reportFiltersSchema>;
export type BestSellingProductsInput = z.infer<typeof bestSellingProductsSchema>;
export type BalanceSheetFilters = z.infer<typeof balanceSheetFiltersSchema>;
