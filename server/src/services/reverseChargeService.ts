/**
 * Reverse Charge Mechanism Service
 * 
 * P1: GST Reverse Charge for specific services and supplies
 */

import prisma from '../config/prisma';

// Categories subject to RCM
export const RCM_CATEGORIES = [
    { code: '9967', description: 'GTA (Goods Transport Agency) services', rate: 5 },
    { code: '9971', description: 'Legal services by advocate', rate: 18 },
    { code: '9972', description: 'Sponsorship services', rate: 18 },
    { code: '9973', description: 'Government services', rate: 18 },
    { code: '9983', description: 'Directors sitting fees', rate: 18 },
    { code: '9985', description: 'Security services from individual/HUF', rate: 18 },
    { code: '9988', description: 'Renting of motor vehicle', rate: 12 },
    { code: '9997', description: 'Services from unregistered suppliers', rate: 18 },
];

interface RCMCalculation {
    isReverseCharge: boolean;
    rcmCategory?: string;
    baseAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalGST: number;
    payableByRecipient: boolean;
}

interface RCMPostingEntry {
    ledgerType: string;
    ledgerName: string;
    debit: number;
    credit: number;
}

class ReverseChargeService {
    /**
     * Check if a service code is subject to RCM
     */
    isRCMApplicable(sacCode: string): boolean {
        return RCM_CATEGORIES.some(cat => sacCode.startsWith(cat.code));
    }

    /**
     * Get RCM category details
     */
    getRCMCategory(sacCode: string): typeof RCM_CATEGORIES[0] | null {
        return RCM_CATEGORIES.find(cat => sacCode.startsWith(cat.code)) || null;
    }

    /**
     * Calculate GST under RCM
     */
    calculateRCMGST(
        amount: number,
        sacCode: string,
        isInterState: boolean
    ): RCMCalculation {
        const rcmCategory = this.getRCMCategory(sacCode);

        if (!rcmCategory) {
            return {
                isReverseCharge: false,
                baseAmount: amount,
                cgst: 0,
                sgst: 0,
                igst: 0,
                totalGST: 0,
                payableByRecipient: false
            };
        }

        const rate = rcmCategory.rate;
        const totalGST = (amount * rate) / 100;

        if (isInterState) {
            return {
                isReverseCharge: true,
                rcmCategory: rcmCategory.description,
                baseAmount: amount,
                cgst: 0,
                sgst: 0,
                igst: totalGST,
                totalGST,
                payableByRecipient: true
            };
        } else {
            const halfGST = totalGST / 2;
            return {
                isReverseCharge: true,
                rcmCategory: rcmCategory.description,
                baseAmount: amount,
                cgst: halfGST,
                sgst: halfGST,
                igst: 0,
                totalGST,
                payableByRecipient: true
            };
        }
    }

    /**
     * Generate ledger posting entries for RCM
     * Under RCM: Recipient debits GST Payable (liability) and claims ITC
     */
    generateRCMPostings(
        amount: number,
        gstAmount: number,
        isInterState: boolean,
        partyLedgerId: string,
        expenseLedgerId: string
    ): RCMPostingEntry[] {
        const postings: RCMPostingEntry[] = [];

        // Debit Expense Account
        postings.push({
            ledgerType: 'EXPENSE',
            ledgerName: 'expense',
            debit: amount,
            credit: 0
        });

        if (isInterState) {
            // Debit IGST Input (ITC claimable)
            postings.push({
                ledgerType: 'GST',
                ledgerName: 'GST_INPUT_IGST',
                debit: gstAmount,
                credit: 0
            });

            // Credit IGST Payable (liability under RCM)
            postings.push({
                ledgerType: 'GST',
                ledgerName: 'GST_PAYABLE_IGST',
                debit: 0,
                credit: gstAmount
            });
        } else {
            const halfGST = gstAmount / 2;

            // Debit CGST Input
            postings.push({
                ledgerType: 'GST',
                ledgerName: 'GST_INPUT_CGST',
                debit: halfGST,
                credit: 0
            });

            // Debit SGST Input
            postings.push({
                ledgerType: 'GST',
                ledgerName: 'GST_INPUT_SGST',
                debit: halfGST,
                credit: 0
            });

            // Credit CGST Payable
            postings.push({
                ledgerType: 'GST',
                ledgerName: 'GST_PAYABLE_CGST',
                debit: 0,
                credit: halfGST
            });

            // Credit SGST Payable
            postings.push({
                ledgerType: 'GST',
                ledgerName: 'GST_PAYABLE_SGST',
                debit: 0,
                credit: halfGST
            });
        }

        // Credit Party Account (vendor payable)
        postings.push({
            ledgerType: 'PARTY',
            ledgerName: 'party',
            debit: 0,
            credit: amount // Only base amount payable to vendor under RCM
        });

        return postings;
    }

    /**
     * Get GSTR-3B RCM summary
     */
    async getGSTR3BRCMSummary(companyId: string, period: { from: Date; to: Date }): Promise<{
        totalRCMTax: number;
        igst: number;
        cgst: number;
        sgst: number;
        invoiceCount: number;
    }> {
        const invoices = await prisma.purchaseBill.findMany({
            where: {
                companyId,
                isReverseCharge: true,
                billDate: {
                    gte: period.from,
                    lte: period.to
                }
            },
            select: {
                cgst: true,
                sgst: true,
                igst: true,
                totalTax: true
            }
        });

        return {
            totalRCMTax: invoices.reduce((sum, inv) => sum + (Number(inv.totalTax) || 0), 0),
            igst: invoices.reduce((sum, inv) => sum + (Number(inv.igst) || 0), 0),
            cgst: invoices.reduce((sum, inv) => sum + (Number(inv.cgst) || 0), 0),
            sgst: invoices.reduce((sum, inv) => sum + (Number(inv.sgst) || 0), 0),
            invoiceCount: invoices.length
        };
    }
}

export default new ReverseChargeService();
