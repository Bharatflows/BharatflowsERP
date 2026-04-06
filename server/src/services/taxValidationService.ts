import { STATE_CODES, getStateCode } from '../constants/india';

export interface TaxValidationResult {
    isValid: boolean;
    errors: string[];
}

export class TaxValidationService {
    // GSTIN Regex Breakdown:
    // 2 digits: State Code
    // 5 letters: PAN Chars
    // 4 digits: PAN Numerals
    // 1 letter: PAN Last Char
    // 1 char: Entity Number (1-9, A-Z)
    // 1 char: 'Z' (Default)
    // 1 char: Checksum
    private static GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    /**
     * Validate GSTIN format and State Code match
     */
    static validateGSTIN(gstin: string, stateName?: string): TaxValidationResult {
        const errors: string[] = [];
        const cleanGSTIN = gstin.toUpperCase().trim();

        if (!this.GSTIN_REGEX.test(cleanGSTIN)) {
            errors.push('Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5');
            return { isValid: false, errors };
        }

        // Validate State Code
        const stateCode = cleanGSTIN.substring(0, 2);
        if (!STATE_CODES[stateCode]) {
            errors.push(`Invalid State Code in GSTIN: ${stateCode}`);
        } else if (stateName) {
            // Check if GSTIN state matches the provided state name
            const expectedCode = getStateCode(stateName);
            if (expectedCode && expectedCode !== stateCode) {
                errors.push(`GSTIN State Code (${stateCode}) does not match Address State (${stateName})`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Determine Tax Type (IGST vs CGST/SGST)
     * Rule: 
     * - Same State -> CGST + SGST (Intra-state)
     * - Different State -> IGST (Inter-state)
     */
    static getRequiredTaxType(supplierState: string, recipientState: string): 'IGST' | 'CGST_SGST' {
        // Normalize
        const normSupplier = supplierState.toLowerCase().trim();
        const normRecipient = recipientState.toLowerCase().trim();

        return normSupplier === normRecipient ? 'CGST_SGST' : 'IGST';
    }

    /**
     * Validate Invoice Tax Rules
     * Ensures correct tax components are used based on place of supply
     */
    static validateInvoiceTax(
        supplierState: string,
        recipientState: string,
        items: Array<{ cgst: number; sgst: number; igst: number }>
    ): TaxValidationResult {
        const errors: string[] = [];
        const requiredType = this.getRequiredTaxType(supplierState, recipientState);

        let hasError = false;

        items.forEach((item, index) => {
            if (hasError) return; // Stop after first error to avoid noise

            if (requiredType === 'IGST') {
                if (item.cgst > 0 || item.sgst > 0) {
                    errors.push(`Inter-state supply (IGST) cannot have CGST/SGST (Item ${index + 1})`);
                    hasError = true;
                }
            } else {
                if (item.igst > 0) {
                    errors.push(`Intra-state supply (CGST+SGST) cannot have IGST (Item ${index + 1})`);
                    hasError = true;
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
