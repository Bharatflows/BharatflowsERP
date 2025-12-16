// ============================================
// SHARED STATUS STYLES (reusable base colors)
// ============================================
const STATUS_STYLES = {
    draft: { color: "text-muted-foreground", bgColor: "bg-muted" },
    pending: { color: "text-yellow-600", bgColor: "bg-yellow-100" },
    sent: { color: "text-blue-600", bgColor: "bg-blue-100" },
    confirmed: { color: "text-blue-600", bgColor: "bg-blue-100" },
    success: { color: "text-green-600", bgColor: "bg-green-100" },
    warning: { color: "text-yellow-600", bgColor: "bg-yellow-100" },
    danger: { color: "text-red-600", bgColor: "bg-red-100" },
    neutral: { color: "text-gray-600", bgColor: "bg-gray-100" },
    purple: { color: "text-purple-600", bgColor: "bg-purple-100" },
} as const;

// Helper to create status object
const s = (value: string, label: string, style: keyof typeof STATUS_STYLES) => ({
    value,
    label,
    ...STATUS_STYLES[style],
});

// ============================================
// DOCUMENT STATUSES
// ============================================
export const INVOICE_STATUSES = {
    DRAFT: s("draft", "Draft", "draft"),
    SENT: s("sent", "Sent", "sent"),
    PAID: s("paid", "Paid", "success"),
    PARTIAL: s("partial", "Partial", "warning"),
    OVERDUE: s("overdue", "Overdue", "danger"),
    CANCELLED: s("cancelled", "Cancelled", "neutral"),
    UNPAID: s("unpaid", "Unpaid", "danger"),
} as const;

export const SALES_ORDER_STATUSES = {
    DRAFT: s("draft", "Draft", "draft"),
    CONFIRMED: s("confirmed", "Confirmed", "confirmed"),
    FULFILLED: s("fulfilled", "Fulfilled", "success"),
    PARTIALLY_FULFILLED: s("partially_fulfilled", "Partially Fulfilled", "warning"),
    CANCELLED: s("cancelled", "Cancelled", "danger"),
} as const;

export const ESTIMATE_STATUSES = {
    PENDING: s("pending", "Pending", "pending"),
    ACCEPTED: s("accepted", "Accepted", "success"),
    REJECTED: s("rejected", "Rejected", "danger"),
    CONVERTED: s("converted", "Converted to Invoice", "sent"),
} as const;

export const QUOTATION_STATUSES = {
    DRAFT: s("draft", "Draft", "draft"),
    SENT: s("sent", "Sent", "sent"),
    VIEWED: s("viewed", "Viewed", "purple"),
    ACCEPTED: s("accepted", "Accepted", "success"),
    REJECTED: s("rejected", "Rejected", "danger"),
    EXPIRED: s("expired", "Expired", "neutral"),
    PENDING: s("pending", "Pending", "pending"),
} as const;

export const DELIVERY_CHALLAN_STATUSES = {
    DRAFT: s("draft", "Draft", "draft"),
    SHIPPED: s("shipped", "Shipped", "sent"),
    DELIVERED: s("delivered", "Delivered", "success"),
    RETURNED: s("returned", "Returned", "danger"),
} as const;

// ============================================
// TYPES
// ============================================
export type StatusValue = string;
export type StatusConfig = { value: string; label: string; color: string; bgColor: string };

// ============================================
// HELPER FUNCTIONS
// ============================================
const ALL_STATUSES = {
    ...INVOICE_STATUSES,
    ...SALES_ORDER_STATUSES,
    ...ESTIMATE_STATUSES,
    ...QUOTATION_STATUSES,
    ...DELIVERY_CHALLAN_STATUSES,
};

export const getStatusConfig = (status: string | undefined): StatusConfig => {
    if (!status) return INVOICE_STATUSES.DRAFT;
    const normalized = status.toLowerCase().replace(/\s+/g, "_");
    const found = Object.values(ALL_STATUSES).find((s) => s.value === normalized);
    return found || { value: status, label: status.charAt(0).toUpperCase() + status.slice(1), ...STATUS_STYLES.draft };
};

export const getStatusColor = (status: string | undefined): string => getStatusConfig(status).color;
export const getStatusBgColor = (status: string | undefined): string => getStatusConfig(status).bgColor;
export const getStatusLabel = (status: string | undefined): string => getStatusConfig(status).label;
