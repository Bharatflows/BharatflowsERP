export enum PaymentMode {
    CASH = 'CASH',
    BANK = 'BANK',
    UPI = 'UPI',
    CHEQUE = 'CHEQUE',
    ONLINE = 'ONLINE',
    CARD = 'CARD',
    NETBANKING = 'NETBANKING'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
    CANCELLED = 'CANCELLED'
}

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
    PAST_DUE = 'PAST_DUE',
    PENDING = 'PENDING',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    // Adding TRIALLING if needed, based on common patterns
    TRIALLING = 'TRIALLING'
}

export enum SubscriptionPlan {
    FREE = 'FREE',
    BASIC = 'BASIC',
    PRO = 'PRO',
    ENTERPRISE = 'ENTERPRISE'
}

export enum VoucherStatus {
    DRAFT = 'DRAFT',
    POSTED = 'POSTED',
    CANCELLED = 'CANCELLED'
}

export enum VoucherType {
    SALES = 'SALES',
    PURCHASE = 'PURCHASE',
    PAYMENT = 'PAYMENT',
    RECEIPT = 'RECEIPT',
    JOURNAL = 'JOURNAL',
    CONTRA = 'CONTRA',
    DEBIT_NOTE = 'DEBIT_NOTE',
    CREDIT_NOTE = 'CREDIT_NOTE'
}

export enum PostingType {
    DEBIT = 'DEBIT',
    CREDIT = 'CREDIT'
}

export enum PaymentGatewayProvider {
    RAZORPAY = 'RAZORPAY',
    STRIPE = 'STRIPE',
    PAYU = 'PAYU',
    CASHFREE = 'CASHFREE',
    MANUAL = 'MANUAL'
}

export enum InvoiceStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    CANCELLED = 'CANCELLED'
}
