// ============================================
// GST RATES (India)
// ============================================
export const GST_RATES = [
    { value: "0", label: "GST 0%", rate: 0, description: "Exempted goods" },
    { value: "0.25", label: "GST 0.25%", rate: 0.25, description: "Rough diamonds" },
    { value: "3", label: "GST 3%", rate: 3, description: "Gold, silver" },
    { value: "5", label: "GST 5%", rate: 5, description: "Essential items" },
    { value: "12", label: "GST 12%", rate: 12, description: "Standard goods" },
    { value: "18", label: "GST 18%", rate: 18, description: "Most goods & services" },
    { value: "28", label: "GST 28%", rate: 28, description: "Luxury items" },
] as const;

export const DEFAULT_GST_RATE = "18";

// ============================================
// TAX TYPES
// ============================================
export const TAX_TYPES = {
    CGST: { value: "cgst", label: "CGST", description: "Central GST" },
    SGST: { value: "sgst", label: "SGST", description: "State GST" },
    IGST: { value: "igst", label: "IGST", description: "Integrated GST" },
    UTGST: { value: "utgst", label: "UTGST", description: "Union Territory GST" },
    CESS: { value: "cess", label: "Cess", description: "Additional cess" },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================
export const getGSTRate = (value: string): number => {
    return GST_RATES.find((r) => r.value === value)?.rate ?? 18;
};

export const calculateTax = (amount: number, gstRate: string, isInterState: boolean) => {
    const rate = getGSTRate(gstRate);
    const taxAmount = (amount * rate) / 100;

    if (isInterState) {
        return { igst: taxAmount, cgst: 0, sgst: 0, total: taxAmount };
    }
    return { igst: 0, cgst: taxAmount / 2, sgst: taxAmount / 2, total: taxAmount };
};

// ============================================
// GST MODES - Inclusive / Exclusive
// ============================================
export const GST_MODES = [
    { value: "exclusive", label: "GST Exclusive", description: "Tax added on top of price" },
    { value: "inclusive", label: "GST Inclusive", description: "Price already includes tax" },
] as const;

export type GSTMode = "inclusive" | "exclusive";

/**
 * GST Exclusive: Price is base price, tax is added on top.
 *   Base = price, Tax = price × rate / 100, Total = price + tax
 *
 * GST Inclusive: Price already includes tax, back-calculate base.
 *   Base = price × 100 / (100 + rate), Tax = price - base, Total = price
 */
export const calculateGST = (
    price: number,
    gstRate: string,
    isInterState: boolean,
    mode: GSTMode = "exclusive"
) => {
    const rate = getGSTRate(gstRate);

    let baseAmount: number;
    let taxAmount: number;
    let totalAmount: number;

    if (mode === "inclusive") {
        // Price already includes GST — back-calculate
        baseAmount = (price * 100) / (100 + rate);
        taxAmount = price - baseAmount;
        totalAmount = price;
    } else {
        // Price is exclusive — add GST on top
        baseAmount = price;
        taxAmount = (price * rate) / 100;
        totalAmount = price + taxAmount;
    }

    if (isInterState) {
        return { baseAmount, igst: taxAmount, cgst: 0, sgst: 0, total: taxAmount, totalAmount };
    }
    return { baseAmount, igst: 0, cgst: taxAmount / 2, sgst: taxAmount / 2, total: taxAmount, totalAmount };
};

// Types
export type GSTRate = (typeof GST_RATES)[number]["value"];
export type TaxType = keyof typeof TAX_TYPES;
