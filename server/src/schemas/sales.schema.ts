import { z } from 'zod';

/**
 * Sales Order Item Schema
 */
const salesOrderItemSchema = z.object({
    productId: z.string().uuid().optional(),
    productName: z.string().min(1, 'Product name is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    rate: z.number().nonnegative('Rate cannot be negative'),
    taxRate: z.number().min(0).max(100, 'Tax rate must be 0-100'),
});

/**
 * Create Sales Order Schema
 */
export const createSalesOrderSchema = z.object({
    customerId: z.string().uuid('Invalid customer ID'),
    items: z.array(salesOrderItemSchema).min(1, 'At least one item is required'),
    orderDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    expectedDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
    notes: z.string().max(1000).optional(),
});

/**
 * Update Sales Order Schema
 */
export const updateSalesOrderSchema = z.object({
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
    notes: z.string().max(1000).optional(),
    items: z.array(salesOrderItemSchema).optional(),
    orderDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    expectedDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

/**
 * Create Estimate Schema
 */
export const createEstimateSchema = z.object({
    customerId: z.string().uuid('Invalid customer ID'),
    items: z.array(salesOrderItemSchema).min(1, 'At least one item is required'),
    estimateDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    validUntil: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
    notes: z.string().max(1000).optional(),
});

export const updateEstimateSchema = createEstimateSchema.partial();

/**
 * Create Quotation Schema
 */
export const createQuotationSchema = z.object({
    customerId: z.string().uuid('Invalid customer ID'),
    items: z.array(salesOrderItemSchema).min(1, 'At least one item is required'),
    quotationDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    validUntil: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
    notes: z.string().max(1000).optional(),
});

export const updateQuotationSchema = createQuotationSchema.partial();

export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
export type UpdateSalesOrderInput = z.infer<typeof updateSalesOrderSchema>;
export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
export type UpdateEstimateInput = z.infer<typeof updateEstimateSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
