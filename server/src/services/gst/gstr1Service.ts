import { PrismaClient } from '@prisma/client';
import { STATE_NAME_TO_CODE } from '../../constants/india';

const prisma = new PrismaClient();

interface GSTR1Data {
    gstin: string;
    fp: string; // Return Period (MMYYYY)
    b2b: any[];
    b2cl: any[];
    b2cs: any[];
    cdnr: any[];
    hk_sums: any[]; // HSN code summary
}

export class GSTR1Service {
    /**
     * Generate GSTR-1 JSON for a given period
     * @param companyId Company ID
     * @param month Month (1-12)
     * @param year Year (YYYY)
     */
    static async generateJson(companyId: string, month: number, year: number): Promise<GSTR1Data> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month
        endDate.setHours(23, 59, 59, 999);

        // Fetch Company Details (GSTIN)
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { gstin: true, businessName: true }
        });

        if (!company?.gstin) {
            throw new Error('Company GSTIN not found. Please update profile.');
        }

        // P0-5.2: Align GST Reporting with Accounting Truth
        // Step 1: Identify Output Tax Ledger IDs
        const taxLedgers = await prisma.ledger.findMany({
            where: {
                companyId,
                code: { in: ['CGST_PAYABLE', 'SGST_PAYABLE', 'IGST_PAYABLE'] }
            },
            select: { id: true }
        });
        const taxLedgerIds = taxLedgers.map(l => l.id);

        // Step 2: Find all Postings to these Tax Ledgers in period
        // This validates that we only report tax that is actually booked in the ledger.
        const taxPostings = await prisma.ledgerPosting.findMany({
            where: {
                companyId,
                ledgerId: { in: taxLedgerIds },
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: { voucherId: true }
        });

        const voucherIds = [...new Set(taxPostings.map(p => p.voucherId))];

        // Step 3: trace back to Invoices via Vouchers
        const vouchers = await prisma.voucher.findMany({
            where: {
                companyId,
                id: { in: voucherIds },
                referenceType: 'INVOICE'
            },
            select: { referenceId: true }
        });

        const validInvoiceIds = vouchers.map(v => v.referenceId as string).filter(id => id);

        // Fetch Invoices (Single Source of Truth)
        // Only fetch invoices that have valid tax ledger postings
        const invoices = await prisma.invoice.findMany({
            where: {
                companyId,
                id: { in: validInvoiceIds },
                status: { not: 'CANCELLED' } // Should handle Credit Notes too (CDNR) - for now just Invoices
            },
            include: {
                customer: true,
                items: true
            }
        });

        const b2b: any[] = [];
        const b2cs: any[] = [];

        // Helper to format State Code (e.g. "27-Maharashtra")
        const formatPOS = (stateName?: string | null) => {
            if (!stateName) return '';
            const code = STATE_NAME_TO_CODE[stateName] || '';
            return code ? `${code}-${stateName}` : stateName;
        };

        for (const invoice of invoices) {
            const isRegistered = !!invoice.customer?.gstin;
            const invoiceValue = Number(invoice.totalAmount);
            const pos = formatPOS((invoice.customer?.billingAddress as any)?.state);

            // Item Level Details
            const invItems = invoice.items.map(rawItem => {
                const item = rawItem as any; // Cast to bypass stale type definition
                return {
                    num: 1, // Serial number of item (Basic logic)
                    itm_det: {
                        rt: item.taxRate, // Rate
                        txval: Number(item.total) - Number(item.taxAmount), // Taxable Value
                        iamt: Number(item.igst || 0), // IGST Amount
                        camt: Number(item.cgst || 0), // CGST Amount
                        samt: Number(item.sgst || 0), // SGST Amount
                        csamt: 0    // Cess
                    }
                };
            });

            if (isRegistered) {
                // B2B Logic
                // Structure: [{ ctin: "GSTIN", inv: [ { ...invoice details... } ] }]

                // Find existing entry for this GSTIN
                let partyEntry = b2b.find(e => e.ctin === invoice.customer?.gstin);
                if (!partyEntry) {
                    partyEntry = {
                        ctin: invoice.customer?.gstin,
                        inv: []
                    };
                    b2b.push(partyEntry);
                }

                partyEntry.inv.push({
                    inum: invoice.invoiceNumber,
                    idt: invoice.invoiceDate.toISOString().split('T')[0].split('-').reverse().join('-'), // DD-MM-YYYY
                    val: invoiceValue,
                    pos: pos,
                    rchrg: "N", // Reverse Charge
                    inv_typ: "R", // Regular
                    itms: invItems
                });

            } else {
                // B2CS Logic (Small Consumer)
                // Aggregated by POS + Rate
                // Structure: [{ sply_ty: "INTRA", pos: "27", typ: "OE", itms: [...] }]

                // For simplicity in MVP, we might treat B2CL later.
                // Assuming all Unregistered < 2.5L or Intra-state are B2CS.

                // Group by POS and Rate
                invoice.items.forEach(rawItem => {
                    const item = rawItem as any;
                    let summary = b2cs.find(e => e.pos === pos && e.rt === item.taxRate);
                    if (!summary) {
                        summary = {
                            sply_ty: Number(item.igst) > 0 ? "INTER" : "INTRA",
                            pos: pos,
                            typ: "OE", // E-Commerce? NO.
                            rt: item.taxRate,
                            txval: 0,
                            iamt: 0,
                            camt: 0,
                            samt: 0,
                            csamt: 0
                        };
                        b2cs.push(summary);
                    }
                    summary.txval += (Number(item.total) - Number(item.taxAmount));
                    summary.iamt += Number(item.igst || 0);
                    summary.camt += Number(item.cgst || 0);
                    summary.samt += Number(item.sgst || 0);
                });
            }
        }

        return {
            gstin: company.gstin,
            fp: `${String(month).padStart(2, '0')}${year}`,
            b2b,
            b2cl: [], // TODO: Implement if needed
            b2cs,
            cdnr: [], // Credit Notes
            hk_sums: [] // HSN Summary
        };
    }
}
