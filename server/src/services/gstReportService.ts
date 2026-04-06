import prisma from '../config/prisma';
import { GST_THRESHOLDS } from '../config/business.config';

interface DateRange {
    from: Date;
    to: Date;
}

export class GSTReportService {

    /**
     * Get GSTR-1 Summary (Outward Supplies)
     * Sections: B2B, B2CL, B2CS, CDNR, EXPORTS
     */
    async getGSTR1Summary(companyId: string, period: DateRange) {
        // 1. Fetch all invoices for the period
        const invoices = await prisma.invoice.findMany({
            where: {
                companyId,
                invoiceDate: {
                    gte: period.from,
                    lte: period.to
                },
                status: { not: 'CANCELLED' }
            },
            include: {
                customer: true
            }
        });

        // 2. Classify Invoices
        const b2b: any[] = [];
        const b2cl: any[] = [];
        const b2cs: any[] = [];
        const exports: any[] = [];

        for (const inv of invoices) {
            const isRegistered = !!inv.customer?.gstin;
            const isInterState = inv.companyId !== inv.customerId; // Simplification: In real app, check state codes
            // Better check:
            // const supplierState = ... 
            // const customerState = ...

            // Total Invoice Value
            const val = Number(inv.totalAmount);

            if (isRegistered) {
                b2b.push(inv);
            } else {
                // Unregistered
                if (val > GST_THRESHOLDS.B2C_LARGE_INVOICE && isInterState) {
                    b2cl.push(inv);
                } else {
                    b2cs.push(inv);
                }
            }

            // Check for exports (based on notes or flags - simplified for now)
            if (inv.notes?.toLowerCase().includes('export')) {
                exports.push(inv);
            }
        }

        // 3. Aggregate Data
        const summarize = (list: any[]) => ({
            count: list.length,
            totalValue: list.reduce((sum, item) => sum + Number(item.totalAmount), 0),
            totalTax: list.reduce((sum, item) => sum + Number(item.totalTax), 0),
        });

        return {
            b2b: summarize(b2b),
            b2cl: summarize(b2cl),
            b2cs: summarize(b2cs),
            exports: summarize(exports),
            totalLiability: invoices.reduce((sum, item) => sum + Number(item.totalTax), 0)
        };
    }

    /**
     * Get GSTR-3B Summary (Monthly Return)
     * Sections: Outward Taxable Supplies, Eligible ITC
     */
    async getGSTR3BSummary(companyId: string, period: DateRange) {

        // 1. Outward Supplies (Values from GSTR-1 logic basically)
        const outwardSupplies = await prisma.invoice.aggregate({
            where: {
                companyId,
                invoiceDate: { gte: period.from, lte: period.to },
                status: { not: 'CANCELLED' }
            },
            _sum: {
                subtotal: true,
                totalTax: true,
                totalAmount: true
            }
        });

        // 2. Eligible ITC (Input Tax Credit from Purchase Bills)
        const inwardSupplies = await prisma.purchaseBill.aggregate({
            where: {
                companyId,
                billDate: { gte: period.from, lte: period.to },
                status: { not: 'CANCELLED' }
            },
            _sum: {
                subtotal: true,
                totalTax: true,
                totalAmount: true
            }
        });

        return {
            outwardSuplies: {
                taxableValue: Number(outwardSupplies._sum.subtotal || 0),
                igst: Number(outwardSupplies._sum.totalTax || 0) / 2, // SImplified split
                cgst: Number(outwardSupplies._sum.totalTax || 0) / 4,
                sgst: Number(outwardSupplies._sum.totalTax || 0) / 4,
                cess: 0
            },
            eligibleITC: {
                taxableValue: Number(inwardSupplies._sum.subtotal || 0),
                igst: Number(inwardSupplies._sum.totalTax || 0) / 2,
                cgst: Number(inwardSupplies._sum.totalTax || 0) / 4,
                sgst: Number(inwardSupplies._sum.totalTax || 0) / 4,
                cess: 0
            },
            netPayable: (Number(outwardSupplies._sum.totalTax || 0) - Number(inwardSupplies._sum.totalTax || 0))
        };
    }
}

export default new GSTReportService();
