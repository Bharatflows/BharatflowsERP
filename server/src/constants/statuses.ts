export const INVOICE_STATUS = {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    PAID: 'PAID',
    PARTIAL: 'PARTIAL',
    OVERDUE: 'OVERDUE',
    CANCELLED: 'CANCELLED',
    UNPAID: 'UNPAID',
} as const;

export const EXPENSE_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    PAID: 'PAID',
} as const;

export const USER_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
} as const;

export const TRANSACTION_STATUS = {
    CLEARED: 'CLEARED',
    PENDING: 'PENDING',
    FAILED: 'FAILED',
} as const;

export const ORDER_STATUS = {
    DRAFT: 'DRAFT',
    CONFIRMED: 'CONFIRMED',
    FULFILLED: 'FULFILLED',
    CANCELLED: 'CANCELLED',
} as const;
