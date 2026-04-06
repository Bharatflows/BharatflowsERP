import { z } from 'zod';

/**
 * Create Expense Schema
 */
export const createExpenseSchema = z.object({
    category: z.string().min(1, 'Category is required').max(100),
    amount: z.number().positive('Amount must be positive'),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    description: z.string().max(500).optional(),
    vendor: z.string().max(200).optional(),
    paymentMethod: z.enum(['CASH', 'BANK', 'UPI', 'CHEQUE', 'CARD']).optional(),
    gstAmount: z.number().nonnegative().optional(),
    notes: z.string().max(1000).optional(),
});

/**
 * Update Expense Schema
 */
export const updateExpenseSchema = z.object({
    category: z.string().min(1).max(100).optional(),
    amount: z.number().positive('Amount must be positive').optional(),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    description: z.string().max(500).optional(),
    vendor: z.string().max(200).optional(),
    paymentMethod: z.enum(['CASH', 'BANK', 'UPI', 'CHEQUE', 'CARD']).optional(),
    gstAmount: z.number().nonnegative().optional(),
    notes: z.string().max(1000).optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
