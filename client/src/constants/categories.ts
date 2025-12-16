// ============================================
// PRODUCT CATEGORIES
// ============================================
export const PRODUCT_CATEGORIES = [
    { value: "electronics", label: "Electronics", icon: "Cpu" },
    { value: "apparel", label: "Apparel & Fashion", icon: "Shirt" },
    { value: "home_kitchen", label: "Home & Kitchen", icon: "Home" },
    { value: "office", label: "Office Supplies", icon: "Briefcase" },
    { value: "raw_materials", label: "Raw Materials", icon: "Package" },
    { value: "machinery", label: "Machinery", icon: "Settings" },
    { value: "packaging", label: "Packaging", icon: "Box" },
    { value: "food_beverage", label: "Food & Beverage", icon: "UtensilsCrossed" },
    { value: "health_beauty", label: "Health & Beauty", icon: "Heart" },
    { value: "automotive", label: "Automotive", icon: "Car" },
    { value: "other", label: "Other", icon: "MoreHorizontal" },
] as const;

// ============================================
// EXPENSE CATEGORIES
// ============================================
export const EXPENSE_CATEGORIES = [
    { value: "rent", label: "Rent", icon: "Building" },
    { value: "salaries", label: "Salaries & Wages", icon: "Users" },
    { value: "utilities", label: "Utilities", icon: "Zap" },
    { value: "office_supplies", label: "Office Supplies", icon: "Package" },
    { value: "travel", label: "Travel & Conveyance", icon: "Plane" },
    { value: "marketing", label: "Marketing & Advertising", icon: "Megaphone" },
    { value: "professional_fees", label: "Professional Fees", icon: "Briefcase" },
    { value: "maintenance", label: "Repairs & Maintenance", icon: "Wrench" },
    { value: "insurance", label: "Insurance", icon: "Shield" },
    { value: "bank_charges", label: "Bank Charges", icon: "Building2" },
    { value: "telephone", label: "Telephone & Internet", icon: "Phone" },
    { value: "depreciation", label: "Depreciation", icon: "TrendingDown" },
    { value: "other", label: "Other Expenses", icon: "MoreHorizontal" },
] as const;

// ============================================
// DOCUMENT CATEGORIES
// ============================================
export const DOCUMENT_CATEGORIES = [
    { value: "all", label: "All Documents" },
    { value: "gst", label: "GST" },
    { value: "legal", label: "Legal" },
    { value: "finance", label: "Finance" },
    { value: "contracts", label: "Contracts" },
    { value: "marketing", label: "Marketing" },
    { value: "hr", label: "HR" },
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================
export const getCategoryLabel = (value: string, type: "product" | "expense" | "document" = "product"): string => {
    const categories = type === "product" ? PRODUCT_CATEGORIES : type === "expense" ? EXPENSE_CATEGORIES : DOCUMENT_CATEGORIES;
    return categories.find((c) => c.value === value)?.label ?? value;
};

// Types
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["value"];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]["value"];
