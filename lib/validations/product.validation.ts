import { z } from 'zod';

export const alternateUOMSchema = z.object({
  name: z.string().min(1, 'UOM name is required').max(50, 'UOM name is too long'),
  conversionFactor: z.number().positive('Conversion factor must be greater than zero'),
  sellingPrice: z.number().positive('Selling price must be greater than zero'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Product name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  category: z.enum(['Carbonated', 'Juices', 'Energy Drinks', 'Water', 'Other'], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  imageUrl: z.string().optional().refine(
    (val) => !val || val === '' || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Invalid image URL' }
  ),
  basePrice: z.number().positive('Base price must be greater than zero'),
  baseUOM: z.string().min(1, 'Base UOM is required').max(50, 'Base UOM is too long'),
  minStockLevel: z.number().int('Minimum stock level must be an integer').positive('Minimum stock level must be greater than zero'),
  shelfLifeDays: z.number().int('Shelf life days must be an integer').positive('Shelf life days must be greater than zero'),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  alternateUOMs: z.array(alternateUOMSchema).optional().default([]),
});

export const updateProductSchema = productSchema.partial();

export type ProductFormData = z.infer<typeof productSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
export type AlternateUOMFormData = z.infer<typeof alternateUOMSchema>;
