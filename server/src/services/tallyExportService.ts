/**
 * Tally XML Export Service
 * Generates Tally-compatible XML (voucher format) for sales/purchase invoices
 */
import prisma from '../config/prisma';
import logger from '../config/logger';

interface TallyVoucher {
    voucherNumber: string;
    date: string;
    partyName: string;
    voucherType: string;
    amount: number;
    ledgerEntries: Array<{ ledger: string; isDr: boolean; amount: number }>;
}

export class TallyExportService {
    /**
     * Export invoices as Tally-compatible XML for a date range
     */
    static async exportInvoices(
        companyId: string,
        startDate: Date,
        endDate: Date,
        invoiceType: 'SALES' | 'PURCHASE' = 'SALES'
    ): Promise<string> {
        let invoices: any[] = [];

        if (invoiceType === 'SALES') {
            invoices = await prisma.invoice.findMany({
                where: {
                    companyId,
                    invoiceDate: { gte: startDate, lte: endDate },
                    deletedAt: null,
                },
                include: {
                    customer: { select: { name: true } },
                    items: { include: { product: { select: { name: true } } } },
                },
                orderBy: { invoiceDate: 'asc' },
            });
        } else {
            const pbills = await prisma.purchaseBill.findMany({
                where: {
                    companyId,
                    billDate: { gte: startDate, lte: endDate },
                    deletedAt: null,
                },
                include: {
                    supplier: { select: { name: true } },
                },
                orderBy: { billDate: 'asc' },
            });
            invoices = pbills.map(pb => ({
                id: pb.id,
                invoiceNumber: pb.billNumber,
                invoiceDate: pb.billDate,
                totalAmount: pb.totalAmount,
                subTotal: pb.subtotal,
                cgstAmount: pb.cgst,
                sgstAmount: pb.sgst,
                igstAmount: pb.igst,
                customer: pb.supplier,
                items: [] // No items relation needed for simple tally voucher yet
            }));
        }

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { businessName: true },
        });

        const vouchers = invoices.map(inv => this.invoiceToVoucher(inv, invoiceType));
        const xml = this.generateTallyXML(vouchers, company?.businessName || 'Company');

        logger.info(`[TallyExport] Generated XML for ${invoices.length} ${invoiceType} invoices`);
        return xml;
    }

    /**
     * Convert a single invoice to a Tally voucher structure
     */
    private static invoiceToVoucher(invoice: any, type: string): TallyVoucher {
        const isSales = type === 'SALES';
        const voucherType = isSales ? 'Sales' : 'Purchase';
        const partyName = invoice.customer?.name || 'Unknown Party';

        const ledgerEntries: TallyVoucher['ledgerEntries'] = [];

        // Party ledger (Dr for Sales, Cr for Purchase)
        ledgerEntries.push({
            ledger: partyName,
            isDr: isSales,
            amount: Number(invoice.totalAmount),
        });

        // Sales/Purchase account (Cr for Sales, Dr for Purchase)
        const subTotal = Number(invoice.subTotal || invoice.totalAmount);
        ledgerEntries.push({
            ledger: isSales ? 'Sales Account' : 'Purchase Account',
            isDr: !isSales,
            amount: subTotal - Number(invoice.cgstAmount || 0) - Number(invoice.sgstAmount || 0) - Number(invoice.igstAmount || 0),
        });

        // GST Ledgers
        const cgst = Number(invoice.cgstAmount || 0);
        const sgst = Number(invoice.sgstAmount || 0);
        const igst = Number(invoice.igstAmount || 0);

        if (cgst > 0) {
            ledgerEntries.push({
                ledger: isSales ? 'CGST Output' : 'CGST Input',
                isDr: !isSales,
                amount: cgst,
            });
        }
        if (sgst > 0) {
            ledgerEntries.push({
                ledger: isSales ? 'SGST Output' : 'SGST Input',
                isDr: !isSales,
                amount: sgst,
            });
        }
        if (igst > 0) {
            ledgerEntries.push({
                ledger: isSales ? 'IGST Output' : 'IGST Input',
                isDr: !isSales,
                amount: igst,
            });
        }

        return {
            voucherNumber: invoice.invoiceNumber,
            date: this.formatTallyDate(invoice.invoiceDate),
            partyName,
            voucherType,
            amount: Number(invoice.totalAmount),
            ledgerEntries,
        };
    }

    /**
     * Generate Tally XML envelope with vouchers
     */
    private static generateTallyXML(vouchers: TallyVoucher[], companyName: string): string {
        const voucherXml = vouchers.map(v => `
    <VOUCHER VCHTYPE="${v.voucherType}" ACTION="Create">
      <DATE>${v.date}</DATE>
      <VOUCHERTYPENAME>${v.voucherType}</VOUCHERTYPENAME>
      <VOUCHERNUMBER>${this.escapeXml(v.voucherNumber)}</VOUCHERNUMBER>
      <PARTYLEDGERNAME>${this.escapeXml(v.partyName)}</PARTYLEDGERNAME>
      <EFFECTIVEDATE>${v.date}</EFFECTIVEDATE>
      <NARRATION>Auto-exported from BharatFlows</NARRATION>
      <ISINVOICE>Yes</ISINVOICE>
${v.ledgerEntries.map(entry => `
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>${this.escapeXml(entry.ledger)}</LEDGERNAME>
        <ISDEEMEDPOSITIVE>${entry.isDr ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
        <AMOUNT>${entry.isDr ? -entry.amount : entry.amount}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>`).join('')}
    </VOUCHER>`).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${this.escapeXml(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
${voucherXml}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
    }

    private static formatTallyDate(date: Date): string {
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
    }

    private static escapeXml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}
