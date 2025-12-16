// Zod Validation Schemas for Purchase Order
import { z } from 'zod';

// Purchase Order Item Schema
export const purchaseOrderItemSchema = z.object({
    productId: z.string().optional(),
    productName: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    hsnCode: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be at least 1'),
    unit: z.string().default('pcs'),
    rate: z.number().min(0, 'Rate cannot be negative'),
    discount: z.number().min(0).max(100, 'Discount must be between 0-100%').default(0),
    taxRate: z.number().min(0).max(28, 'Tax rate must be between 0-28%').default(18),
});

// Purchase Order Create Schema
export const createPurchaseOrderSchema = z.object({
    supplierId: z.string().uuid('Please select a supplier'),
    orderNumber: z.string().optional(),
    orderDate: z.string().min(1, 'Order date is required'),
    expectedDate: z.string().min(1, 'Expected delivery date is required'),
    items: z.array(purchaseOrderItemSchema).min(1, 'Add at least one item'),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
    termsConditions: z.string().max(1000, 'Terms cannot exceed 1000 characters').optional(),
    paymentTerms: z.string().optional(),
});

// Purchase Order Update Schema (all fields optional)
export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial();

// Types inferred from schemas
export type PurchaseOrderItemFormData = z.infer<typeof purchaseOrderItemSchema>;
export type CreatePurchaseOrderFormData = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderFormData = z.infer<typeof updatePurchaseOrderSchema>;

// Validation helper
export function validatePurchaseOrder(data: unknown) {
    return createPurchaseOrderSchema.safeParse(data);
}
