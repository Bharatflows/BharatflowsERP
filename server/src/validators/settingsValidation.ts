/**
 * Settings Validation Schemas
 * 
 * Comprehensive Zod schemas for all settings modules:
 * - Profile (User Account)
 * - Preferences
 * - Notifications
 * - Business Profile
 * - Bank Details
 * - Branches
 * - Financial Year
 * - Document Numbers
 * - Approval Workflows
 * - Roles & Permissions
 */

import { z } from 'zod';

// ============================================
// Common Validators
// ============================================

const phoneRegex = /^[+]?[1-9]?[0-9]{7,14}$/;
const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

// ============================================
// 1. Profile Schemas (Account → My Profile)
// ============================================

export const ProfileUpdateSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters')
        .optional(),
    phone: z.string()
        .regex(phoneRegex, 'Invalid phone number format')
        .nullable()
        .optional(),
    designation: z.string()
        .max(100, 'Designation must be at most 100 characters')
        .nullable()
        .optional(),
    bio: z.string()
        .max(500, 'Bio must be at most 500 characters')
        .nullable()
        .optional(),
    avatar: z.string()
        .url('Invalid avatar URL')
        .nullable()
        .optional(),
    signature: z.string()
        .url('Invalid signature URL')
        .nullable()
        .optional(),
});

// ============================================
// 2. Preferences Schemas (Account → Preferences)
// ============================================

export const PreferencesSchema = z.object({
    language: z.enum(['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Gujarati', 'Bengali'])
        .default('English'),
    timezone: z.string()
        .default('Asia/Kolkata'),
    dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
        .default('DD/MM/YYYY'),
    numberFormat: z.enum(['Indian', 'International'])
        .default('Indian'),
    theme: z.enum(['Light', 'Dark', 'System'])
        .default('Light'),
    currency: z.string()
        .default('INR'),
});

// ============================================
// 3. Notification Settings Schema
// ============================================

export const NotificationSettingsSchema = z.object({
    // Email Notifications
    emailInvoice: z.boolean().default(true),
    emailPayment: z.boolean().default(true),
    emailLowStock: z.boolean().default(true),
    emailGST: z.boolean().default(false),
    emailExpenseApproval: z.boolean().default(true),
    emailQuotation: z.boolean().default(false),

    // Mobile Push Notifications
    mobileInvoice: z.boolean().default(true),
    mobilePayment: z.boolean().default(true),
    mobileLowStock: z.boolean().default(false),
    mobileGST: z.boolean().default(false),

    // WhatsApp Notifications (Premium)
    whatsappInvoice: z.boolean().default(false),
    whatsappPayment: z.boolean().default(false),
    whatsappLowStock: z.boolean().default(false),
    whatsappReminder: z.boolean().default(false),

    // In-App Notifications
    inAppEnabled: z.boolean().default(true),
    inAppSound: z.boolean().default(true),
});

// ============================================
// 4. Password Change Schema (Account → Security)
// ============================================

export const PasswordChangeSchema = z.object({
    currentPassword: z.string()
        .min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
});

// ============================================
// 5. Business Profile Schema
// ============================================

export const BusinessProfileSchema = z.object({
    businessName: z.string()
        .min(3, 'Business name must be at least 3 characters')
        .max(200, 'Business name must be at most 200 characters'),
    legalName: z.string()
        .max(200, 'Legal name must be at most 200 characters')
        .nullable()
        .optional(),
    gstin: z.string()
        .trim()
        .toUpperCase()
        .regex(gstinRegex, 'Invalid GSTIN format (e.g., 27AAPFU0939F1ZV)')
        .nullable()
        .optional(),
    pan: z.string()
        .trim()
        .toUpperCase()
        .regex(panRegex, 'Invalid PAN format (e.g., ABCDE1234F)')
        .nullable()
        .optional(),
    legalType: z.enum([
        'Sole Proprietorship',
        'Partnership',
        'LLP',
        'Private Limited',
        'Public Limited',
        'One Person Company',
        'Hindu Undivided Family',
        'Trust',
        'Society',
    ]).nullable().optional(),
    industry: z.string()
        .max(100)
        .nullable()
        .optional(),
    email: z.string()
        .email('Invalid email address')
        .optional(),
    phone: z.string()
        .regex(phoneRegex, 'Invalid phone number')
        .optional(),
    website: z.string()
        .url('Invalid website URL')
        .nullable()
        .optional(),
    yearEstablished: z.number()
        .int()
        .min(1800, 'Year must be after 1800')
        .max(new Date().getFullYear(), 'Year cannot be in the future')
        .nullable()
        .optional(),
    employeesCount: z.enum(['1-10', '11-50', '51-200', '201-500', '500+'])
        .nullable()
        .optional(),
});

// ============================================
// 6. Business Address Schema
// ============================================

export const AddressSchema = z.object({
    line1: z.string()
        .min(1, 'Address line 1 is required')
        .max(200, 'Address line 1 must be at most 200 characters'),
    line2: z.string()
        .max(200, 'Address line 2 must be at most 200 characters')
        .nullable()
        .optional(),
    city: z.string()
        .min(1, 'City is required')
        .max(100, 'City must be at most 100 characters'),
    state: z.string()
        .min(1, 'State is required'),
    pincode: z.string()
        .regex(pincodeRegex, 'Invalid pincode (must be 6 digits)'),
    country: z.string()
        .default('India'),
});

// ============================================
// 7. Bank Details Schema
// ============================================

export const BankDetailsSchema = z.object({
    accountName: z.string()
        .min(3, 'Account holder name is required')
        .max(200, 'Account name must be at most 200 characters'),
    accountNumber: z.string()
        .min(9, 'Account number must be at least 9 digits')
        .max(18, 'Account number must be at most 18 digits')
        .regex(/^[0-9]+$/, 'Account number must contain only digits'),
    confirmAccountNumber: z.string()
        .optional(),
    ifscCode: z.string()
        .regex(ifscRegex, 'Invalid IFSC code format (e.g., HDFC0001234)'),
    bankName: z.string()
        .min(2, 'Bank name is required')
        .max(100, 'Bank name must be at most 100 characters'),
    branch: z.string()
        .min(2, 'Branch name is required')
        .max(200, 'Branch name must be at most 200 characters'),
    accountType: z.enum(['Current Account', 'Savings Account', 'Cash Credit', 'Overdraft'])
        .default('Current Account'),
    isVerified: z.boolean()
        .default(false),
}).refine((data) => {
    if (data.confirmAccountNumber) {
        return data.accountNumber === data.confirmAccountNumber;
    }
    return true;
}, {
    message: 'Account numbers do not match',
    path: ['confirmAccountNumber'],
});

// ============================================
// 8. Branch Schema
// ============================================

export const BranchSchema = z.object({
    name: z.string()
        .min(2, 'Branch name must be at least 2 characters')
        .max(100, 'Branch name must be at most 100 characters'),
    code: z.string()
        .min(2, 'Branch code must be at least 2 characters')
        .max(10, 'Branch code must be at most 10 characters')
        .regex(/^[A-Z0-9]+$/, 'Branch code must be uppercase alphanumeric'),
    gstin: z.string()
        .trim()
        .toUpperCase()
        .regex(gstinRegex, 'Invalid GSTIN format')
        .nullable()
        .optional(),
    address: z.string()
        .min(10, 'Address is required')
        .max(500, 'Address must be at most 500 characters'),
    city: z.string()
        .min(2, 'City is required')
        .max(100, 'City must be at most 100 characters'),
    state: z.string()
        .min(2, 'State is required'),
    pincode: z.string()
        .regex(pincodeRegex, 'Invalid pincode'),
    phone: z.string()
        .regex(phoneRegex, 'Invalid phone number')
        .nullable()
        .optional(),
    email: z.string()
        .email('Invalid email address')
        .nullable()
        .optional(),
    isPrimary: z.boolean()
        .default(false),
    isActive: z.boolean()
        .default(true),
});

// ============================================
// 9. Financial Year Schema
// ============================================

export const FinancialYearCreateSchema = z.object({
    name: z.string()
        .min(3, 'Financial year name is required')
        .max(50, 'Name must be at most 50 characters')
        .regex(/^FY\s?\d{4}-\d{2,4}$/, 'Invalid format (e.g., FY 2024-25)'),
    startDate: z.string()
        .or(z.date())
        .transform((val) => new Date(val)),
    endDate: z.string()
        .or(z.date())
        .transform((val) => new Date(val)),
}).refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
});

export const FinancialYearLockSchema = z.object({
    reason: z.string()
        .min(10, 'Lock reason must be at least 10 characters')
        .max(500, 'Lock reason must be at most 500 characters'),
    confirmLock: z.boolean()
        .refine((val) => val === true, 'You must confirm the lock action'),
});

export const FinancialYearUnlockSchema = z.object({
    reason: z.string()
        .min(20, 'Unlock reason must be at least 20 characters (explain why)')
        .max(500, 'Unlock reason must be at most 500 characters'),
    overrideNote: z.string()
        .max(500)
        .optional(),
    confirmUnlock: z.boolean()
        .refine((val) => val === true, 'You must confirm the unlock action'),
});

// ============================================
// 10. Document Number Sequence Schema
// ============================================

export const SequenceUpdateSchema = z.object({
    prefix: z.string()
        .min(1, 'Prefix is required')
        .max(10, 'Prefix must be at most 10 characters')
        .regex(/^[A-Z]+$/, 'Prefix must be uppercase letters only'),
    nextNumber: z.number()
        .int('Must be a whole number')
        .min(1, 'Next number must be at least 1')
        .max(9999999, 'Next number is too large'),
    format: z.string()
        .max(50, 'Format must be at most 50 characters')
        .regex(
            /^.*\{(PREFIX|YEAR|MONTH|SEQ(:\d+)?)\}.*$/,
            'Format must include at least one placeholder: {PREFIX}, {YEAR}, {MONTH}, {SEQ:N}'
        )
        .optional(),
});

// ============================================
// 11. Approval Workflow Schema
// ============================================

export const ApprovalWorkflowSchema = z.object({
    name: z.string()
        .min(3, 'Workflow name must be at least 3 characters')
        .max(100, 'Workflow name must be at most 100 characters'),
    module: z.enum([
        'INVOICE',
        'PURCHASE_ORDER',
        'EXPENSE',
        'QUOTATION',
        'SALES_ORDER',
        'CREDIT_NOTE',
        'DEBIT_NOTE',
    ]),
    trigger: z.enum(['ALWAYS', 'AMOUNT_EXCEEDS', 'SPECIFIC_CATEGORY']),
    condition: z.string()
        .max(500, 'Condition must be at most 500 characters')
        .optional(),
    thresholdAmount: z.number()
        .min(0, 'Threshold must be positive')
        .optional(),
    approvers: z.array(z.string().uuid('Invalid approver ID'))
        .min(1, 'At least one approver is required')
        .max(5, 'Maximum 5 approvers allowed'),
    isActive: z.boolean()
        .default(true),
    notifyOnApproval: z.boolean()
        .default(true),
    notifyOnRejection: z.boolean()
        .default(true),
    autoApproveAfterDays: z.number()
        .int()
        .min(0)
        .max(30)
        .nullable()
        .optional(),
});

// ============================================
// 12. Custom Role & Permissions Schema
// ============================================

export const PermissionSchema = z.object({
    module: z.string(),
    view: z.boolean().default(false),
    create: z.boolean().default(false),
    edit: z.boolean().default(false),
    delete: z.boolean().default(false),
    approve: z.boolean().default(false),
    export: z.boolean().default(false),
});

export const CustomRoleSchema = z.object({
    name: z.string()
        .min(2, 'Role name must be at least 2 characters')
        .max(50, 'Role name must be at most 50 characters')
        .regex(/^[a-zA-Z0-9\s]+$/, 'Role name can only contain letters, numbers, and spaces'),
    description: z.string()
        .max(200, 'Description must be at most 200 characters')
        .optional(),
    permissions: z.array(PermissionSchema)
        .min(1, 'At least one permission is required'),
    isActive: z.boolean()
        .default(true),
});

// ============================================
// 13. User Management Schema
// ============================================

export const UserInviteSchema = z.object({
    email: z.string()
        .email('Invalid email address'),
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters'),
    phone: z.string()
        .regex(phoneRegex, 'Invalid phone number')
        .optional(),
    role: z.enum(['ADMIN', 'STAFF'])
        .default('STAFF'),
    customRoleId: z.string()
        .uuid('Invalid role ID')
        .optional(),
    branchIds: z.array(z.string().uuid('Invalid branch ID'))
        .optional(),
    moduleAccess: z.record(z.string(), z.boolean())
        .optional(),
});

export const UserUpdateSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters')
        .optional(),
    phone: z.string()
        .regex(phoneRegex, 'Invalid phone number')
        .nullable()
        .optional(),
    role: z.enum(['ADMIN', 'STAFF'])
        .optional(),
    customRoleId: z.string()
        .uuid('Invalid role ID')
        .nullable()
        .optional(),
    status: z.enum(['ACTIVE', 'INACTIVE'])
        .optional(),
    branchIds: z.array(z.string().uuid('Invalid branch ID'))
        .optional(),
});

// ============================================
// 14. Device Management Schema
// ============================================

export const DeviceRegisterSchema = z.object({
    deviceName: z.string()
        .min(2, 'Device name is required')
        .max(100, 'Device name must be at most 100 characters'),
    deviceType: z.enum(['MOBILE', 'TABLET', 'DESKTOP', 'BROWSER']),
    platform: z.string()
        .max(50)
        .optional(),
    osVersion: z.string()
        .max(50)
        .optional(),
    appVersion: z.string()
        .max(50)
        .optional(),
    pushToken: z.string()
        .optional(),
});

// ============================================
// 15. IP Whitelist Schema
// ============================================

export const IPWhitelistSchema = z.object({
    ipAddress: z.string()
        .regex(
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            'Invalid IPv4 address format'
        ),
    description: z.string()
        .min(3, 'Description is required')
        .max(200, 'Description must be at most 200 characters'),
    isActive: z.boolean()
        .default(true),
    expiresAt: z.string()
        .or(z.date())
        .transform((val) => val ? new Date(val) : null)
        .nullable()
        .optional(),
});

// ============================================
// 16. App Configuration Schema
// ============================================

export const AppConfigSchema = z.object({
    enabledModules: z.record(z.string(), z.boolean())
        .optional(),
    features: z.record(z.string(), z.boolean())
        .optional(),
    valuationMethod: z.enum(['FIFO', 'WEIGHTED_AVERAGE', 'AVERAGE'])
        .default('AVERAGE'),
    defaultPaymentTerms: z.number()
        .int()
        .min(0)
        .max(365)
        .default(30),
    lowStockAlertThreshold: z.number()
        .int()
        .min(0)
        .default(10),
    autoGenerateInvoiceNumber: z.boolean()
        .default(true),
    allowNegativeStock: z.boolean()
        .default(false),
    requireApprovalForDiscount: z.boolean()
        .default(false),
    maxDiscountPercent: z.number()
        .min(0)
        .max(100)
        .default(20),
});

// ============================================
// 17. Branding Settings Schema
// ============================================

export const BrandingSchema = z.object({
    primaryColor: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'),
    secondaryColor: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')
        .optional(),
    accentColor: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')
        .optional(),
    invoicePrefix: z.string()
        .max(10)
        .optional(),
    estimatePrefix: z.string()
        .max(10)
        .optional(),
    poPrefix: z.string()
        .max(10)
        .optional(),
    includeGSTNote: z.boolean()
        .default(true),
    includeTerms: z.boolean()
        .default(true),
    termsAndConditions: z.string()
        .max(2000, 'Terms must be at most 2000 characters')
        .optional(),
    invoiceFooterNote: z.string()
        .max(500)
        .optional(),
});

// ============================================
// Type Exports
// ============================================

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;
export type PasswordChange = z.infer<typeof PasswordChangeSchema>;
export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type BankDetails = z.infer<typeof BankDetailsSchema>;
export type Branch = z.infer<typeof BranchSchema>;
export type FinancialYearCreate = z.infer<typeof FinancialYearCreateSchema>;
export type FinancialYearLock = z.infer<typeof FinancialYearLockSchema>;
export type SequenceUpdate = z.infer<typeof SequenceUpdateSchema>;
export type ApprovalWorkflow = z.infer<typeof ApprovalWorkflowSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type CustomRole = z.infer<typeof CustomRoleSchema>;
export type UserInvite = z.infer<typeof UserInviteSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type DeviceRegister = z.infer<typeof DeviceRegisterSchema>;
export type IPWhitelist = z.infer<typeof IPWhitelistSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;
export type Branding = z.infer<typeof BrandingSchema>;

// ============================================
// Validation Helper
// ============================================

/**
 * Validate data against a schema and return formatted errors
 */
export function validateSettings<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    }

    return { success: false, errors };
}
