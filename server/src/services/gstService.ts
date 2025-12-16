/**
 * GSTService - Tax Computation Engine
 * Handles State vs State tax logic (Inter vs Intra)
 */

import { ValidationUtils } from './validationService';

export interface TaxBreakup {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    totalAmount: number;
    taxType: 'INTRA' | 'INTER'; // Intra-state (CGST+SGST) or Inter-state (IGST)
}

export class GSTService {
    /**
     * Calculates tax breakup based on Supplier and Place of Supply state codes
     * @param amount Taxable amount
     * @param taxRate GST Rate (e.g., 18 for 18%)
     * @param supplierStateCode 2-digit state code of Supplier (Company)
     * @param placeOfSupplyStateCode 2-digit state code of Customer
     */
    static calculateTax(
        amount: number,
        taxRate: number,
        supplierStateCode: string,
        placeOfSupplyStateCode: string
    ): TaxBreakup {
        const rate = Number(taxRate);
        const amt = Number(amount);

        // Determine Inter vs Intra
        // If state codes match -> Intra-state -> CGST + SGST
        // If state codes differ -> Inter-state -> IGST
        const isIntraState = supplierStateCode === placeOfSupplyStateCode;

        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        if (isIntraState) {
            const halfRate = rate / 2;
            cgst = Number(((amt * halfRate) / 100).toFixed(2));
            sgst = Number(((amt * halfRate) / 100).toFixed(2));
        } else {
            igst = Number(((amt * rate) / 100).toFixed(2));
        }

        const totalTax = Number((cgst + sgst + igst).toFixed(2));
        const totalAmount = Number((amt + totalTax).toFixed(2));

        return {
            taxableValue: amt,
            cgst,
            sgst,
            igst,
            totalTax,
            totalAmount,
            taxType: isIntraState ? 'INTRA' : 'INTER'
        };
    }

    /**
     * Derives Place of Supply from Customer GSTIN
     * Fallback to manual state code if GSTIN not provided (for B2C)
     */
    static getPlaceOfSupply(customerGstin: string | null, manualStateCode: string | null): string | null {
        if (customerGstin && ValidationUtils.isValidGSTIN(customerGstin)) {
            return ValidationUtils.getGSTStateCode(customerGstin);
        }
        return manualStateCode;
    }
}
