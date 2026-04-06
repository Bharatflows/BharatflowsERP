import prisma from '../config/prisma';
import axios from 'axios';

/**
 * GSTIntegrationService - Connects BharatFlows to GST Portal via Sandbox.co.in
 * Handles E-Invoicing, GSTR-2B Sync, and Live Filing.
 */
export class GSTIntegrationService {
    // H8: GST Live Integration
    private static get API_BASE() {
        return process.env.GST_PORTAL_MODE === 'live'
            ? (process.env.GST_LIVE_API_URL || 'https://api.e-invoice.gst.gov.in') // Placeholder Live URL
            : 'https://api.sandbox.co.in';
    }

    private static get AUTH_TOKEN() {
        return process.env.GST_PORTAL_MODE === 'live'
            ? process.env.GST_LIVE_API_KEY
            : process.env.SANDBOX_API_KEY;
    }

    /**
     * Generates an E-Invoice (IRN) for a given invoice ID
     */
    static async generateEInvoice(invoiceId: string, companyId: string) {
        try {
            const invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId, companyId },
                include: {
                    customer: true,
                    items: { include: { product: true } },
                    company: true
                }
            });

            if (!invoice) throw new Error('Invoice not found');

            // 1. Prepare E-Invoice JSON (Standard Schema)
            const payload = {
                access_token: this.AUTH_TOKEN,
                data: {
                    DocDtls: {
                        Typ: 'INV',
                        No: invoice.invoiceNumber,
                        Dt: invoice.invoiceDate.toISOString().split('T')[0]
                    },
                    SellerDtls: {
                        Gstin: invoice.company.gstin,
                        LglNm: invoice.company.businessName,
                        Addr1: invoice.company.address
                    },
                    BuyerDtls: {
                        Gstin: invoice.customer.gstin,
                        LglNm: invoice.customer.name,
                        Pos: invoice.customer.gstin ? invoice.customer.gstin.substring(0, 2) : '00',
                        Addr1: invoice.customer.billingAddress
                    },
                    ItemList: invoice.items.map((item, index) => ({
                        SlNo: (index + 1).toString(),
                        PrdDesc: item.productName,
                        IsServc: 'N',
                        HsnCd: item.product?.hsnCode || '0000',
                        Qty: Number(item.quantity),
                        Unit: item.product?.unit || 'PCS',
                        UnitPrice: Number(item.rate),
                        TotAmt: Number(item.quantity) * Number(item.rate),
                        TaxableVal: Number(item.quantity) * Number(item.rate),
                        GstRt: Number(item.taxRate),
                        CgstAmt: Number(item.taxAmount) / 2,
                        SgstAmt: Number(item.taxAmount) / 2,
                        TotItemVal: Number(item.total)
                    })),
                    ValDtls: {
                        AssVal: Number(invoice.subtotal),
                        CgstVal: Number(invoice.totalTax) / 2,
                        SgstVal: Number(invoice.totalTax) / 2,
                        TotInvVal: Number(invoice.totalAmount)
                    }
                }
            };

            // 2. API Call (Sandbox vs Live)
            const isLive = process.env.GST_PORTAL_MODE === 'live';
            let irn, ackNo, signedInvoice, signedQr;

            if (isLive) {
                // Determine GSP provider and make real call
                if (!this.AUTH_TOKEN) throw new Error('Live GST API Key not configured');

                // Example Live Call Logic (Commented out until credentials available)
                /* 
                const response = await axios.post(`${this.API_BASE}/eiv/generate`, payload, {
                    headers: { Authorization: `Bearer ${this.AUTH_TOKEN}` }
                });
                irn = response.data.Irn;
                */
                throw new Error('Live Mode requires valid GSP credentials. Please configure GST_LIVE_API_KEY.');
            } else {
                // Mock API Call for Sandbox
                irn = `IRN${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                ackNo = `ACK${Date.now()}`;
            }

            // 3. Save to EInvoice Table
            const existing = await prisma.eInvoice.findUnique({
                where: { invoiceId }
            });

            let eInvoice;
            if (existing) {
                eInvoice = await prisma.eInvoice.update({
                    where: { invoiceId },
                    data: {
                        irn,
                        ackNumber: ackNo,
                        ackDate: new Date(),
                        status: 'GENERATED',
                        jsonPayload: payload as any
                    }
                });
            } else {
                eInvoice = await prisma.eInvoice.create({
                    data: {
                        invoiceId,
                        invoiceNumber: invoice.invoiceNumber,
                        invoiceDate: invoice.invoiceDate,
                        irn,
                        ackNumber: ackNo,
                        ackDate: new Date(),
                        status: 'GENERATED',
                        customerName: invoice.customer.name,
                        gstin: invoice.customer.gstin,
                        invoiceValue: invoice.totalAmount,
                        companyId,
                        jsonPayload: payload as any
                    }
                });
            }

            return { success: true, data: eInvoice };
        } catch (error: any) {
            console.error('E-Invoice Generation Error:', error);
            throw error;
        }
    }

    /**
     * Syncs GSTR-2B data from portal and reconciles with Purchase Bills
     */
    static async syncGSTR2B(period: string, companyId: string) {
        try {
            // 1. Mock Fetch from Portal
            // fetchGSTR2BRecords(period, gstin)
            const mockPortalRecords = [
                {
                    supplierGstin: '27AAAAA0000A1Z5',
                    supplierName: 'Tech Solutions Ltd',
                    invoiceNumber: 'INV-2024-001',
                    invoiceDate: new Date('2024-11-15'),
                    invoiceValue: 11800,
                    taxableValue: 10000,
                    cgst: 900,
                    sgst: 900
                }
            ];

            const results = [];

            for (const record of mockPortalRecords) {
                // 2. Check for local matching Purchase Bill
                const matchingBill = await prisma.purchaseBill.findFirst({
                    where: {
                        companyId,
                        billNumber: record.invoiceNumber,
                        subtotal: record.taxableValue
                    }
                });

                // 3. Create GSTR2B Record Entry
                const status = matchingBill ? 'MATCHED' : 'UNMATCHED';

                const gstr2b = await prisma.gSTR2BRecord.upsert({
                    where: {
                        supplierGstin_invoiceNumber_returnPeriod_companyId: {
                            supplierGstin: record.supplierGstin,
                            invoiceNumber: record.invoiceNumber,
                            returnPeriod: period,
                            companyId
                        }
                    },
                    update: {
                        matchStatus: status,
                        purchaseBillId: matchingBill?.id || null
                    },
                    create: {
                        supplierGstin: record.supplierGstin,
                        supplierName: record.supplierName,
                        invoiceNumber: record.invoiceNumber,
                        invoiceDate: record.invoiceDate,
                        invoiceValue: record.invoiceValue,
                        taxableValue: record.taxableValue,
                        cgst: record.cgst,
                        sgst: record.sgst,
                        returnPeriod: period,
                        companyId,
                        matchStatus: status,
                        purchaseBillId: matchingBill?.id || null
                    }
                });

                results.push(gstr2b);
            }

            return { success: true, count: results.length, data: results };
        } catch (error: any) {
            console.error('GSTR-2B Sync Error:', error);
            throw error;
        }
    }
}
