// ============================================
// INDIAN STATES & UNION TERRITORIES
// ============================================
export const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    // Union Territories
    "Delhi", "Puducherry", "Jammu and Kashmir", "Ladakh",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

// State code mapping (for GSTIN validation)
export const STATE_CODES: Record<string, string> = {
    "Andhra Pradesh": "37", "Arunachal Pradesh": "12", "Assam": "18", "Bihar": "10",
    "Chhattisgarh": "22", "Goa": "30", "Gujarat": "24", "Haryana": "06",
    "Himachal Pradesh": "02", "Jharkhand": "20", "Karnataka": "29", "Kerala": "32",
    "Madhya Pradesh": "23", "Maharashtra": "27", "Manipur": "14", "Meghalaya": "17",
    "Mizoram": "15", "Nagaland": "13", "Odisha": "21", "Punjab": "03", "Rajasthan": "08",
    "Sikkim": "11", "Tamil Nadu": "33", "Telangana": "36", "Tripura": "16",
    "Uttar Pradesh": "09", "Uttarakhand": "05", "West Bengal": "19", "Delhi": "07",
    "Puducherry": "34", "Jammu and Kashmir": "01", "Ladakh": "38",
};
