// ============================================
// PRODUCT UNITS
// ============================================
export const PRODUCT_UNITS = [
    // Count
    { value: "pcs", label: "Pieces", abbr: "PCS", category: "count" },
    { value: "nos", label: "Numbers", abbr: "NOS", category: "count" },
    { value: "dozen", label: "Dozen", abbr: "DZ", category: "count" },
    { value: "pair", label: "Pair", abbr: "PR", category: "count" },
    // Weight
    { value: "kg", label: "Kilograms", abbr: "KG", category: "weight" },
    { value: "g", label: "Grams", abbr: "G", category: "weight" },
    { value: "mg", label: "Milligrams", abbr: "MG", category: "weight" },
    { value: "ton", label: "Metric Ton", abbr: "MT", category: "weight" },
    { value: "quintal", label: "Quintal", abbr: "QTL", category: "weight" },
    // Volume
    { value: "ltr", label: "Litres", abbr: "LTR", category: "volume" },
    { value: "ml", label: "Millilitres", abbr: "ML", category: "volume" },
    { value: "kl", label: "Kilolitres", abbr: "KL", category: "volume" },
    // Length
    { value: "m", label: "Meters", abbr: "M", category: "length" },
    { value: "cm", label: "Centimeters", abbr: "CM", category: "length" },
    { value: "mm", label: "Millimeters", abbr: "MM", category: "length" },
    { value: "ft", label: "Feet", abbr: "FT", category: "length" },
    { value: "inch", label: "Inches", abbr: "IN", category: "length" },
    // Area
    { value: "sqm", label: "Square Meters", abbr: "SQM", category: "area" },
    { value: "sqft", label: "Square Feet", abbr: "SQFT", category: "area" },
    // Packaging
    { value: "box", label: "Box", abbr: "BOX", category: "packaging" },
    { value: "pack", label: "Pack", abbr: "PACK", category: "packaging" },
    { value: "set", label: "Set", abbr: "SET", category: "packaging" },
    { value: "carton", label: "Carton", abbr: "CTN", category: "packaging" },
    { value: "bundle", label: "Bundle", abbr: "BDL", category: "packaging" },
] as const;

export const DEFAULT_UNIT = "pcs";

// ============================================
// HELPER FUNCTIONS
// ============================================
export const getUnitLabel = (value: string): string => {
    return PRODUCT_UNITS.find((u) => u.value === value)?.label ?? value;
};

export const getUnitAbbr = (value: string): string => {
    return PRODUCT_UNITS.find((u) => u.value === value)?.abbr ?? value.toUpperCase();
};

export const getUnitsByCategory = (category: string) => {
    return PRODUCT_UNITS.filter((u) => u.category === category);
};

// Types
export type ProductUnit = (typeof PRODUCT_UNITS)[number]["value"];
export type UnitCategory = (typeof PRODUCT_UNITS)[number]["category"];
