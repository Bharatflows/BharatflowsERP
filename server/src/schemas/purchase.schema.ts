import { z } from 'zod';

/**
 * Purchase Bill Item Schema
 */
export const purchaseBillItemSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().positive('Quantity must be positive'),
    rate: z.number().nonnegative('Rate cannot be negative'),
    taxRate: z.number().min(0).max(100, 'Tax rate must be 0-100'),
    sku: z.string().optional(),
    hsnCode: z.string().optional(),
});

/**
 * Create Purchase Bill Schema
 */
export const createPurchaseBillSchema = z.object({
    vendorId: z.string().uuid('Invalid vendor ID'),
    billNumber: z.string().min(1, 'Bill number is required'),
    billDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    items: z.array(purchaseBillItemSchema).min(1, 'At least one item is required'),
    status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID']).optional(),
    notes: z.string().max(1000).optional(),
});

/**
 * Update Purchase Bill Schema
 */
export const updatePurchaseBillSchema = createPurchaseBillSchema.partial();

/**
 * Create GRN Schema
 */
export const createGRNSchema = z.object({
    purchaseOrderId: z.string().uuid('Invalid Purchase Order ID').optional(),
    vendorId: z.string().uuid('Invalid vendor ID'),
    grnNumber: z.string().min(1, 'GRN number is required'),
    receivedDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    items: z.array(purchaseBillItemSchema.extend({
        receivedQuantity: z.number().nonnegative('Received quantity cannot be negative'),
        acceptedQuantity: z.number().nonnegative('Accepted quantity cannot be negative'),
        rejectedQuantity: z.number().nonnegative().optional(),
    })).min(1, 'At least one item is required'),
    notes: z.string().max(1000).optional(),
});

export const updateGRNSchema = createGRNSchema.partial();

export type CreatePurchaseBillInput = z.infer<typeof createPurchaseBillSchema>;
export type UpdatePurchaseBillInput = z.infer<typeof updatePurchaseBillSchema>;
export type CreateGRNInput = z.infer<typeof createGRNSchema>;
export type UpdateGRNInput = z.infer<typeof updateGRNSchema>;
