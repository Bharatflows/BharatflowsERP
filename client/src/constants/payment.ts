// ============================================
// PAYMENT TERMS
// ============================================
export const PAYMENT_TERMS = [
    { value: "due_on_receipt", label: "Due on Receipt", days: 0 },
    { value: "net_7", label: "Net 7", days: 7 },
    { value: "net_15", label: "Net 15", days: 15 },
    { value: "net_30", label: "Net 30", days: 30 },
    { value: "net_45", label: "Net 45", days: 45 },
    { value: "net_60", label: "Net 60", days: 60 },
    { value: "net_90", label: "Net 90", days: 90 },
] as const;

export const DEFAULT_PAYMENT_TERM = "due_on_receipt";

// ============================================
// PAYMENT METHODS
// ============================================
export const PAYMENT_METHODS = [
    { value: "cash", label: "Cash", icon: "Banknote" },
    { value: "bank_transfer", label: "Bank Transfer", icon: "Building2" },
    { value: "upi", label: "UPI", icon: "Smartphone" },
    { value: "cheque", label: "Cheque", icon: "FileText" },
    { value: "card", label: "Card", icon: "CreditCard" },
    { value: "online", label: "Online", icon: "Globe" },
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================
export const getPaymentTermDays = (term: string): number => {
    return PAYMENT_TERMS.find((t) => t.value === term)?.days ?? 0;
};

export const getPaymentTermLabel = (term: string): string => {
    return PAYMENT_TERMS.find((t) => t.value === term)?.label ?? term;
};

// Types
export type PaymentTerm = (typeof PAYMENT_TERMS)[number]["value"];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];
