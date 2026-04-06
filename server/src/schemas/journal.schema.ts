import { z } from 'zod';

/**
 * Journal Entry Line Item Schema
 */
export const journalLineSchema = z.object({
    accountId: z.string().uuid('Invalid account ID'),
    description: z.string().optional(),
    debit: z.number().nonnegative().optional(),
    credit: z.number().nonnegative().optional(),
}).refine(data => (data.debit || 0) > 0 || (data.credit || 0) > 0, {
    message: "Either debit or credit must be greater than 0",
    path: ["debit"]
});

/**
 * Create Journal Entry Schema
 */
export const createJournalEntrySchema = z.object({
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    reference: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    lines: z.array(journalLineSchema).min(2, 'Journal entry must have at least 2 lines'),
    status: z.enum(['DRAFT', 'POSTED']).optional(),
}).refine(data => {
    const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return Math.abs(totalDebit - totalCredit) < 0.01; // Allow small floating point diff
}, {
    message: "Total Debit must equal Total Credit",
    path: ["lines"] // Attach error to lines
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
