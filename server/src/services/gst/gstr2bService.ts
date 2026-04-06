import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GSTR2BEntry {
    gstin: string; // Supplier GSTIN
    tradeName?: string;
    invoiceNumber: string;
    invoiceDate: string; // YYYY-MM-DD
    invoiceValue: number;
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
}

export interface ReconciliationResult {
    matched: any[];
    missingInBooks: GSTR2BEntry[];
    missingInPortal: any[];
    mismatches: any[];
}

export class GSTR2BService {
    /**
     * Reconcile Purchase Bills with GSTR-2B Data
     * @param companyId Company ID
     * @param portalData Array of GSTR-2B entries from JSON/Excel
     * @param month Month (1-12)
     * @param year Year (YYYY)
     */
    static async reconcile(
        companyId: string,
        portalData: GSTR2BEntry[],
        month: number,
        year: number
    ): Promise<ReconciliationResult> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        endDate.setHours(23, 59, 59, 999);

        // Fetch System Purchase Bills
        const systemBills = await prisma.purchaseBill.findMany({
            where: {
                companyId,
                billDate: {
                    gte: startDate,
                    lte: endDate
                },
                status: { not: 'CANCELLED' }
            },
            include: {
                supplier: true
            }
        });

        const matched: any[] = [];
        const missingInBooks: GSTR2BEntry[] = [];
        const missingInPortal: any[] = [];
        const mismatches: any[] = [];

        // specific normalization helper
        const normalize = (str: string) => str.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // 1. Check Portal Data against System
        for (const entry of portalData) {
            // Find in system bills
            const match = systemBills.find(bill => {
                const gstinMatch = bill.supplier?.gstin === entry.gstin;
                const invMatch = normalize(bill.billNumber) === normalize(entry.invoiceNumber);
                // Can also check date tolerance
                return gstinMatch && invMatch;
            });

            if (match) {
                // Check for value Mismatches
                const sysTotal = Number(match.totalAmount);
                const portalTotal = entry.invoiceValue;
                const diff = Math.abs(sysTotal - portalTotal);

                if (diff < 1.0) { // Tolerance of 1 Rupee
                    matched.push({ system: match, portal: entry });
                } else {
                    mismatches.push({
                        reason: 'Amount Mismatch',
                        systemAmount: sysTotal,
                        portalAmount: portalTotal,
                        system: match,
                        portal: entry
                    });
                }

                // Mark system bill as processed (for finding missingInPortal later)
                (match as any)._processed = true;
            } else {
                missingInBooks.push(entry);
            }
        }

        // 2. Find Missing in Portal
        for (const bill of systemBills) {
            if (!(bill as any)._processed) {
                missingInPortal.push(bill);
            }
        }

        return {
            matched,
            missingInBooks,
            missingInPortal,
            mismatches
        };
    }
}
