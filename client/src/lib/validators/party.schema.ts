// Zod Validation Schemas for Party (Customer/Supplier)
import { z } from 'zod';

// Party Create Schema
export const createPartySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    type: z.enum(['CUSTOMER', 'SUPPLIER', 'BOTH']).default('CUSTOMER'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string()
        .min(10, 'Phone must be at least 10 digits')
        .max(15, 'Phone cannot exceed 15 digits')
        .optional()
        .or(z.literal('')),
    gstin: z.string()
        .length(15, 'GSTIN must be exactly 15 characters')
        .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
        .optional()
        .or(z.literal('')),
    pan: z.string()
        .length(10, 'PAN must be exactly 10 characters')
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
        .optional()
        .or(z.literal('')),
    address: z.string().max(200, 'Address cannot exceed 200 characters').optional(),
    city: z.string().max(50, 'City cannot exceed 50 characters').optional(),
    state: z.string().max(50, 'State cannot exceed 50 characters').optional(),
    pincode: z.string()
        .length(6, 'Pincode must be 6 digits')
        .regex(/^[0-9]{6}$/, 'Pincode must be numeric')
        .optional()
        .or(z.literal('')),
    openingBalance: z.number().default(0),
    creditLimit: z.number().min(0).optional(),
    paymentTerms: z.number().min(0).max(365).optional(),
});

// Party Update Schema
export const updatePartySchema = createPartySchema.partial();

// Types
export type CreatePartyFormData = z.infer<typeof createPartySchema>;
export type UpdatePartyFormData = z.infer<typeof updatePartySchema>;

// Validation helper
export function validateParty(data: unknown) {
    return createPartySchema.safeParse(data);
}
