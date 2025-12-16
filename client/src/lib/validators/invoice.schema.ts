// Zod Validation Schemas for Invoice
import { z } from 'zod';

// Invoice Item Schema
export const invoiceItemSchema = z.object({
    productId: z.string().min(1, 'Please select a product'),
    productName: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    hsnCode: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be at least 1'),
    unit: z.string().default('pcs'),
    rate: z.number().min(0, 'Rate cannot be negative'),
    discount: z.number().min(0).max(100, 'Discount must be between 0-100%').default(0),
    taxRate: z.number().min(0).max(28, 'Tax rate must be between 0-28%').default(18),
});

// Invoice Create Schema
export const createInvoiceSchema = z.object({
    customerId: z.string().uuid('Please select a customer'),
    invoiceDate: z.string().min(1, 'Invoice date is required'),
    dueDate: z.string().optional(),
    invoiceNumber: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, 'Add at least one item'),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
    termsAndConditions: z.string().max(1000, 'Terms cannot exceed 1000 characters').optional(),
    paymentTerms: z.string().optional(),
});

// Invoice Update Schema (all fields optional)
export const updateInvoiceSchema = createInvoiceSchema.partial();

// Types inferred from schemas
export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceFormData = z.infer<typeof updateInvoiceSchema>;

// Validation helper
export function validateInvoice(data: unknown) {
    return createInvoiceSchema.safeParse(data);
}
