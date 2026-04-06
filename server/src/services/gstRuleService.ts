import { Prisma } from '@prisma/client';

export interface TaxBreakdown {
    cgst: Prisma.Decimal;
    sgst: Prisma.Decimal;
    igst: Prisma.Decimal;
    cess: Prisma.Decimal;
    taxableValue: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
}

export interface GSTRuleInput {
    taxableValue: number | Prisma.Decimal;
    gstRate: number | Prisma.Decimal;
    placeOfSupplyState: string;
    companyState: string;
    isSEZ?: boolean;
    isExport?: boolean;
    cessRate?: number | Prisma.Decimal;
}

/**
 * P1-5.1 GST Rule Engine
 * Deterministic tax calculation based on Place of Supply (POS) rules.
 * 
 * Rules:
 * 1. Intra-State (Same State) -> CGST + SGST (50% each)
 * 2. Inter-State (Different State) -> IGST (100%)
 * 3. SEZ / Export -> IGST (Zero Rated if LUT, otherwise IGST) - logic handled as IGST here for simplicity unless LUT flag specifically added later
 */
export const gstRuleService = {
    calculateLineItem(input: GSTRuleInput): TaxBreakdown {
        const taxable = new Prisma.Decimal(input.taxableValue);
        const rate = new Prisma.Decimal(input.gstRate);
        const cessRate = input.cessRate ? new Prisma.Decimal(input.cessRate) : new Prisma.Decimal(0);

        // Normalize state codes/names for comparison (basic)
        const isInterState = this.isInterStateSupply(input.companyState, input.placeOfSupplyState, input.isSEZ, input.isExport);

        let cgst = new Prisma.Decimal(0);
        let sgst = new Prisma.Decimal(0);
        let igst = new Prisma.Decimal(0);
        let cess = new Prisma.Decimal(0);

        if (rate.greaterThan(0)) {
            const taxAmount = taxable.mul(rate).div(100);

            if (isInterState) {
                igst = taxAmount;
            } else {
                const halfTax = taxAmount.div(2);
                cgst = halfTax;
                sgst = halfTax;
            }
        }

        if (cessRate.greaterThan(0)) {
            cess = taxable.mul(cessRate).div(100);
        }

        const totalTax = cgst.add(sgst).add(igst).add(cess);
        const totalAmount = taxable.add(totalTax);

        return {
            cgst,
            sgst,
            igst,
            cess,
            taxableValue: taxable,
            taxAmount: totalTax,
            totalAmount
        };
    },

    isInterStateSupply(originState: string, destState: string, isSEZ: boolean = false, isExport: boolean = false): boolean {
        if (isSEZ || isExport) return true; // SEZ and Exports are always Inter-State (IGST)

        // Basic normalization: lowercase and trim
        const origin = originState?.toLowerCase().trim();
        const dest = destState?.toLowerCase().trim();

        if (!origin || !dest) return true; // Fallback to Inter-state if state unknown (safer for compliance)

        return origin !== dest;
    },

    /**
     * Calculates tax included (Reverse calculation)
     * e.g. MRP includes GST
     */
    calculateBackwards(totalAmount: number | Prisma.Decimal, gstRate: number | Prisma.Decimal, placeOfSupply: string, companyState: string): TaxBreakdown {
        const total = new Prisma.Decimal(totalAmount);
        const rate = new Prisma.Decimal(gstRate);

        // Formula: Taxable = Total / (1 + Rate/100)
        const taxable = total.div(new Prisma.Decimal(1).add(rate.div(100)));

        return this.calculateLineItem({
            taxableValue: taxable,
            gstRate: rate,
            placeOfSupplyState: placeOfSupply,
            companyState: companyState
        });
    },

    /**
     * Extracts state code from GSTIN (first 2 characters)
     */
    getStateCodeFromGSTIN(gstin: string): string | null {
        if (!gstin || gstin.length < 2) return null;
        return gstin.substring(0, 2);
    }
};
