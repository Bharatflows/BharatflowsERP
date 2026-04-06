/**
 * Place of Supply Service
 * 
 * P0: Determines if a transaction is interstate or intrastate for GST purposes
 * Handles IGST vs CGST+SGST determination
 */

import { STATE_CODES as INDIA_STATE_CODES } from '../constants/india';

// Re-export for backward compatibility (existing code expects STATE_CODES from this file)
export const STATE_CODES: Record<string, string> = {
    ...INDIA_STATE_CODES,
    '99': 'Centre Jurisdiction' // Additional code specific to GST
};

/**
 * Extract state code from GSTIN
 */
export function getStateCodeFromGSTIN(gstin: string): string | null {
    if (!gstin || gstin.length < 2) return null;
    const stateCode = gstin.substring(0, 2);
    return STATE_CODES[stateCode] ? stateCode : null;
}

/**
 * Get state name from state code
 */
export function getStateName(stateCode: string): string {
    return STATE_CODES[stateCode] || 'Unknown';
}

/**
 * Determine if transaction is interstate
 */
export function isInterStateTransaction(
    supplierStateCode: string,
    recipientStateCode: string
): boolean {
    if (!supplierStateCode || !recipientStateCode) {
        return false; // Default to intrastate if unknown
    }
    return supplierStateCode !== recipientStateCode;
}

/**
 * Calculate GST split based on place of supply
 * 
 * For interstate (IGST): Full tax as IGST
 * For intrastate: Split 50-50 between CGST and SGST
 */
export function calculateGSTSplit(
    totalTax: number,
    isInterState: boolean
): { cgst: number; sgst: number; igst: number } {
    if (isInterState) {
        return {
            cgst: 0,
            sgst: 0,
            igst: totalTax
        };
    } else {
        const halfTax = totalTax / 2;
        return {
            cgst: halfTax,
            sgst: halfTax,
            igst: 0
        };
    }
}

export interface PlaceOfSupplyResult {
    supplierStateCode: string;
    supplierStateName: string;
    recipientStateCode: string;
    recipientStateName: string;
    isInterState: boolean;
    gstType: 'IGST' | 'CGST+SGST';
    gstSplit: { cgst: number; sgst: number; igst: number };
}

/**
 * Determine Place of Supply and GST type for a transaction
 * 
 * For B2B:
 *   - Location of recipient (buyer's registered place of business)
 * 
 * For B2C Goods:
 *   - Location where goods are delivered
 * 
 * For B2C Services:
 *   - Location of recipient (if address available) or supplier
 */
export function determinePlaceOfSupply(
    supplierGSTIN: string | null,
    recipientGSTIN: string | null,
    recipientState: string | null,
    totalTax: number
): PlaceOfSupplyResult {
    // Get supplier state from GSTIN
    const supplierStateCode = supplierGSTIN ? getStateCodeFromGSTIN(supplierGSTIN) : null;

    // Get recipient state - prefer GSTIN, fallback to explicit state
    let recipientStateCode: string | null = null;
    if (recipientGSTIN) {
        recipientStateCode = getStateCodeFromGSTIN(recipientGSTIN);
    } else if (recipientState && recipientState.length === 2) {
        recipientStateCode = recipientState;
    }

    // Determine if interstate
    const isInterState = supplierStateCode && recipientStateCode
        ? isInterStateTransaction(supplierStateCode, recipientStateCode)
        : false;

    // Calculate GST split
    const gstSplit = calculateGSTSplit(totalTax, isInterState);

    return {
        supplierStateCode: supplierStateCode || '',
        supplierStateName: supplierStateCode ? getStateName(supplierStateCode) : 'Unknown',
        recipientStateCode: recipientStateCode || '',
        recipientStateName: recipientStateCode ? getStateName(recipientStateCode) : 'Unknown',
        isInterState,
        gstType: isInterState ? 'IGST' : 'CGST+SGST',
        gstSplit
    };
}

/**
 * Validate GSTIN format
 */
export function isValidGSTIN(gstin: string): boolean {
    if (!gstin || gstin.trim().length !== 15) return false;

    // GSTIN format: 2 digit state code + 10 char PAN + 1 entity number + 1 check digit
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin.trim().toUpperCase());
}

/**
 * Determine if reverse charge is applicable
 * 
 * Reverse charge applies when:
 * 1. Supplier is unregistered and recipient is registered
 * 2. Specific services (legal, GTA, sponsorship, etc.)
 * 3. Import of services
 */
export function isReverseChargeApplicable(
    supplierGSTIN: string | null,
    recipientGSTIN: string | null,
    serviceType?: string
): boolean {
    // Basic reverse charge: Unregistered supplier to registered recipient
    if (!supplierGSTIN && recipientGSTIN) {
        return true;
    }

    // Specific services that attract reverse charge
    const rcmServices = [
        'LEGAL_SERVICES',
        'GTA_SERVICES', // Goods Transport Agency
        'SPONSORSHIP',
        'DIRECTOR_SERVICES',
        'INSURANCE_AGENT',
        'RECOVERY_AGENT',
        'COPYRIGHT'
    ];

    if (serviceType && rcmServices.includes(serviceType.toUpperCase())) {
        return true;
    }

    return false;
}

export default {
    STATE_CODES,
    getStateCodeFromGSTIN,
    getStateName,
    isInterStateTransaction,
    calculateGSTSplit,
    determinePlaceOfSupply,
    isValidGSTIN,
    isReverseChargeApplicable
};
