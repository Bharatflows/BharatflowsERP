/**
 * GSTR-1 Extended Sections Service
 * 
 * P1: B2C Large (>₹2.5L) and Export Invoice sections
 */

import prisma from '../config/prisma';
import { GST_THRESHOLDS } from '../config/business.config';

interface B2CLInvoice {
    pos: string;          // Place of Supply (state code)
    invoiceNumber: string;
    invoiceDate: Date;
    invoiceValue: number;
    taxableValue: number;
    rate: number;
    igstAmount: number;
    etin?: string;        // E-commerce operator TIN if applicable
}

interface ExportInvoice {
    exportType: 'WPAY' | 'WOPAY';  // With Payment / Without Payment
    invoiceNumber: string;
    invoiceDate: Date;
    invoiceValue: number;
    portCode?: string;
    shippingBillNumber?: string;
    shippingBillDate?: Date;
    rate: number;
    taxableValue: number;
    igstAmount: number;
}

interface GSTR1B2CLSection {
    invoices: B2CLInvoice[];
    summary: {
        totalInvoices: number;
        totalValue: number;
        totalTaxableValue: number;
        totalIGST: number;
    };
}

interface GSTR1ExportSection {
    invoices: ExportInvoice[];
    summary: {
        withPayment: number;
        withoutPayment: number;
        totalValue: number;
        totalTaxableValue: number;
        totalIGST: number;
    };
}

class GSTR1ExtendedService {
    private readonly B2C_LARGE_THRESHOLD = GST_THRESHOLDS.B2C_LARGE_INVOICE;

    /**
     * Get B2C Large Invoices (>₹2.5L to unregistered recipients)
     */
    async getB2CLSection(companyId: string, period: { from: Date; to: Date }): Promise<GSTR1B2CLSection> {
        // Find B2C invoices > ₹2.5L (customer without GSTIN)
        const invoices = await prisma.invoice.findMany({
            where: {
                companyId,
                invoiceDate: {
                    gte: period.from,
                    lte: period.to
                },
                totalAmount: {
                    gt: this.B2C_LARGE_THRESHOLD
                },
                customer: {
                    gstin: null // Unregistered customer
                }
            },
            include: {
                customer: true
            }
        });

        const b2clInvoices: B2CLInvoice[] = invoices.map(inv => {
            // Calculate weighted average rate
            const taxableValue = Number(inv.subtotal) || 0;
            const igstAmount = Number(inv.totalTax) || 0;
            const rate = taxableValue > 0 ? (igstAmount / taxableValue) * 100 : 0;

            return {
                pos: (inv as any).placeOfSupply || '99', // State code or 99 for unknown
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: inv.invoiceDate,
                invoiceValue: Number(inv.totalAmount) || 0,
                taxableValue,
                rate: Math.round(rate * 100) / 100,
                igstAmount
            };
        });

        return {
            invoices: b2clInvoices,
            summary: {
                totalInvoices: b2clInvoices.length,
                totalValue: b2clInvoices.reduce((sum, inv) => sum + inv.invoiceValue, 0),
                totalTaxableValue: b2clInvoices.reduce((sum, inv) => sum + inv.taxableValue, 0),
                totalIGST: b2clInvoices.reduce((sum, inv) => sum + inv.igstAmount, 0)
            }
        };
    }

    /**
     * Get Export Invoice section
     */
    async getExportSection(companyId: string, period: { from: Date; to: Date }): Promise<GSTR1ExportSection> {
        // Find export invoices - check notes for 'export' or 'sez' marker
        const invoices = await prisma.invoice.findMany({
            where: {
                companyId,
                invoiceDate: {
                    gte: period.from,
                    lte: period.to
                }
            },
            include: {
                customer: true
            }
        });

        // Filter for export invoices based on notes
        const exportFiltered = invoices.filter(inv => {
            const notes = (inv.notes || '').toLowerCase();
            return notes.includes('export') || notes.includes('sez');
        });

        const exportInvoices: ExportInvoice[] = invoices.map(inv => {
            const invData = inv as any;
            const taxableValue = Number(inv.subtotal) || 0;
            const igstAmount = invData.exportType === 'WOPAY' ? 0 : Number(inv.totalTax) || 0;
            const rate = taxableValue > 0 && igstAmount > 0 ? (igstAmount / taxableValue) * 100 : 0;

            return {
                exportType: invData.exportType || 'WPAY',
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: inv.invoiceDate,
                invoiceValue: Number(inv.totalAmount) || 0,
                portCode: invData.portCode,
                shippingBillNumber: invData.shippingBillNumber,
                shippingBillDate: invData.shippingBillDate,
                rate: Math.round(rate * 100) / 100,
                taxableValue,
                igstAmount
            };
        });

        const withPayment = exportInvoices.filter(inv => inv.exportType === 'WPAY');
        const withoutPayment = exportInvoices.filter(inv => inv.exportType === 'WOPAY');

        return {
            invoices: exportInvoices,
            summary: {
                withPayment: withPayment.reduce((sum, inv) => sum + inv.invoiceValue, 0),
                withoutPayment: withoutPayment.reduce((sum, inv) => sum + inv.invoiceValue, 0),
                totalValue: exportInvoices.reduce((sum, inv) => sum + inv.invoiceValue, 0),
                totalTaxableValue: exportInvoices.reduce((sum, inv) => sum + inv.taxableValue, 0),
                totalIGST: exportInvoices.reduce((sum, inv) => sum + inv.igstAmount, 0)
            }
        };
    }

    /**
     * Check if an invoice qualifies as B2C Large
     */
    isB2CLarge(amount: number, customerGstin: string | null): boolean {
        return amount > this.B2C_LARGE_THRESHOLD && !customerGstin;
    }

    /**
     * Get complete GSTR-1 extended sections
     */
    async getExtendedSections(companyId: string, period: { from: Date; to: Date }) {
        const [b2cl, exports] = await Promise.all([
            this.getB2CLSection(companyId, period),
            this.getExportSection(companyId, period)
        ]);

        return {
            b2cl,
            exports,
            hasB2CL: b2cl.invoices.length > 0,
            hasExports: exports.invoices.length > 0
        };
    }
}

export default new GSTR1ExtendedService();
