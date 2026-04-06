// ============================================
// SERVER BUSINESS CONFIGURATION
// Centralized business rules and thresholds
// ============================================

/**
 * GST-related thresholds
 */
export const GST_THRESHOLDS = {
    /** B2C Large invoice threshold for GSTR-1 (₹2.5 Lakhs) */
    B2C_LARGE_INVOICE: 250000,
    /** E-Invoice mandatory threshold (₹5 crores) */
    E_INVOICE_MANDATORY: 50000000,
    /** E-Way bill mandatory threshold (₹) */
    E_WAYBILL_MANDATORY: 50000,
} as const;

/**
 * Transaction limits
 */
export const TRANSACTION_LIMITS = {
    /** Default max transaction amount for staff (₹) */
    STAFF_MAX: 500000,
    /** Threshold above which approval is required (₹) */
    APPROVAL_REQUIRED: 50000,
    /** Manager approval threshold (₹) */
    MANAGER_APPROVAL: 500000,
} as const;

/**
 * Outstanding balance thresholds
 */
export const OUTSTANDING_THRESHOLDS = {
    /** Amount above which outstanding is considered "high" (₹) */
    HIGH: 50000,
    /** Amount above which outstanding is critical (₹) */
    CRITICAL: 100000,
} as const;

/**
 * Default pagination settings
 */
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DEFAULT_PAGE: 1,
} as const;
