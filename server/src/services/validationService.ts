/**
 * ValidationUtils - Statutory Compliance Helper
 * Handles statutory validations for Indian MSMEs
 */

export class ValidationUtils {
    // Regex for GSTIN: 2 ints, 5 chars, 4 ints, 1 char, 1 char (1-9/A-Z), Z, 1 alphanumeric
    private static GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    // Regex for PAN: 5 chars, 4 ints, 1 char
    private static PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]{1}$/;

    /**
     * Validates if a GSTIN is structurally correct
     */
    static isValidGSTIN(gstin: string): boolean {
        if (!gstin) return false;
        return this.GSTIN_REGEX.test(gstin.trim().toUpperCase());
    }

    /**
     * Extracts PAN from GSTIN (Chars 3-12)
     */
    static extractPAN(gstin: string): string | null {
        if (!this.isValidGSTIN(gstin)) return null;
        return gstin.substring(2, 12);
    }

    /**
     * Extracts State Code from GSTIN (First 2 chars)
     */
    static getGSTStateCode(gstin: string): string | null {
        if (!this.isValidGSTIN(gstin)) return null;
        return gstin.substring(0, 2);
    }

    /**
     * Validates if a PAN is structurally correct
     */
    static isValidPAN(pan: string): boolean {
        if (!pan) return false;
        return this.PAN_REGEX.test(pan.trim().toUpperCase());
    }
}
