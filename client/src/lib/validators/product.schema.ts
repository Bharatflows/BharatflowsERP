// Zod Validation Schemas for Product
import { z } from 'zod';

// Product Create Schema
export const createProductSchema = z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    code: z.string().min(1, 'Product code/SKU is required').optional(),
    description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
    category: z.string().optional(),
    unit: z.string().min(1, 'Unit is required').default('pcs'),
    hsnCode: z.string()
        .min(4, 'HSN code must be at least 4 digits')
        .max(8, 'HSN code cannot exceed 8 digits')
        .regex(/^[0-9]+$/, 'HSN code must be numeric')
        .optional()
        .or(z.literal('')),
    purchasePrice: z.number().min(0, 'Purchase price cannot be negative').default(0),
    sellingPrice: z.number().min(0, 'Selling price cannot be negative').default(0),
    taxRate: z.number().min(0).max(28, 'Tax rate must be between 0-28%').default(18),
    currentStock: z.number().int().min(0, 'Stock cannot be negative').default(0),
    lowStockThreshold: z.number().int().min(0).default(10),
    isActive: z.boolean().default(true),
});

// Product Update Schema
export const updateProductSchema = createProductSchema.partial();

// Stock Adjustment Schema
export const stockAdjustmentSchema = z.object({
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    type: z.enum(['ADD', 'REMOVE', 'DAMAGE', 'RETURN', 'CORRECTION']),
    reason: z.string().min(1, 'Reason is required'),
    notes: z.string().max(200).optional(),
    warehouseId: z.string().optional(),
});

// Types
export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

// Validation helpers
export function validateProduct(data: unknown) {
    return createProductSchema.safeParse(data);
}

export function validateStockAdjustment(data: unknown) {
    return stockAdjustmentSchema.safeParse(data);
}
