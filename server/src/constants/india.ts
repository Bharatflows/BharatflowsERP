// ============================================
// INDIAN STATES & STATE CODES
// Shared constants for server-side usage
// ============================================

/**
 * Indian state code to name mapping
 * Used for GST, GSTIN validation, and place of supply
 */
export const STATE_CODES: Record<string, string> = {
    '01': 'Jammu and Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '26': 'Dadra and Nagar Haveli and Daman and Diu',
    '27': 'Maharashtra',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh',
    '97': 'Other Territory',
};

/**
 * State name to code mapping (reverse lookup)
 */
export const STATE_NAME_TO_CODE: Record<string, string> = Object.entries(STATE_CODES).reduce(
    (acc, [code, name]) => {
        acc[name] = code;
        return acc;
    },
    {} as Record<string, string>
);

/**
 * List of all Indian states (sorted)
 */
export const INDIAN_STATES = Object.values(STATE_CODES).sort();

/**
 * Get state name from code
 */
export function getStateName(code: string): string | undefined {
    return STATE_CODES[code];
}

/**
 * Get state code from name
 */
export function getStateCode(name: string): string | undefined {
    return STATE_NAME_TO_CODE[name];
}

/**
 * Validate if a state code is valid
 */
export function isValidStateCode(code: string): boolean {
    return code in STATE_CODES;
}
