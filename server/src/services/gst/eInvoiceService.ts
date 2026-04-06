
import prisma from '../../config/prisma';
import { ValidationUtils } from '../validationService';

// --- NIC Schema Interfaces (Partial/Key Fields) ---
interface EinvoicePayload {
    Version: string;
    TranDtls: {
        TaxSch: string;
        SupTyp: string;
        RegRev?: string;
        EcmGstin?: null;
        IgstOnIntra?: string;
    };
    DocDtls: {
        Typ: string;
        No: string;
        Dt: string;
    };
    SellerDtls: {
        Gstin: string;
        LglNm: string;
        TrdNm?: string;
        Addr1: string;
        Loc: string;
        Pin: number;
        Stcd: string;
        Ph?: string;
        Em?: string;
    };
    BuyerDtls: {
        Gstin: string;
        LglNm: string;
        TrdNm?: string;
        Pos: string;
        Addr1: string;
        Loc: string;
        Pin: number;
        Stcd: string;
        Ph?: string;
        Em?: string;
    };
    ItemList: Array<{
        SlNo: string;
        PrdDesc: string;
        IsServc: string;
        HsnCd: string;
        Qty: number;
        Unit: string;
        UnitPrice: number;
        TotAmt: number;
        Discount: number;
        PreTaxVal: number;
        AssAmt: number;
        GstRt: number;
        IgstAmt?: number;
        CgstAmt?: number;
        SgstAmt?: number;
        CesAmt?: number;
        CesNonAdvlAmt?: number;
        StateCesAmt?: number;
        TotItemVal: number;
    }>;
    ValDtls: {
        AssVal: number;
        CgstVal: number;
        SgstVal: number;
        IgstVal: number;
        CesVal: number;
        StCesVal: number;
        Discount: number;
        OthChrg: number;
        RndOffAmt: number;
        TotInvVal: number;
    };
}

export class GSTEInvoiceService {

    /**
     * Maps a database Invoice to the NIC E-Invoice JSON Schema (v1.1)
     */
    static async generatePayload(invoiceId: string, companyId: string): Promise<EinvoicePayload> {
        // Fetch Invoice with full hierarchy
        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, companyId },
            include: {
                customer: true,
                company: true,
                items: { include: { product: true } }
            }
        });

        if (!invoice) throw new Error("Invoice not found");

        const company = invoice.company;
        const customer = invoice.customer;

        // Basic Validations
        if (!company.gstin) throw new Error("Company GSTIN is missing");
        if (!customer.gstin) throw new Error("Customer GSTIN is missing (Required for B2B E-Invoice)");
        if (!company.address || typeof company.address !== 'object') throw new Error("Company Address is missing or invalid");
        if (!customer.billingAddress || typeof customer.billingAddress !== 'object') throw new Error("Customer Billing Address is missing or invalid");

        // Helper to parse address
        const getAddr = (addr: any) => ({
            addr1: addr.addressLine1 || addr.street || "Unknown Street",
            loc: addr.city || "Unknown City",
            pin: Number(addr.pincode) || 0,
            stcd: ValidationUtils.getGSTStateCode(company.gstin || '') || '00'
        });

        const sellerAddr = getAddr(company.address);
        // @ts-ignore
        const buyerAddr = getAddr(customer.billingAddress);
        // Override buyer stcd from GSTIN
        buyerAddr.stcd = ValidationUtils.getGSTStateCode(customer.gstin) || '00';

        // Map Items
        const itemList = invoice.items.map((item, index) => {
            const isService = item.product?.category === 'SERVICE' ? 'Y' : 'N';

            // Tax Calculation Breakdown
            const taxableValue = Number(item.total) - Number(item.taxAmount);
            const igstAmount = buyerAddr.stcd !== sellerAddr.stcd ? Number(item.taxAmount) : 0;
            const cgstAmount = buyerAddr.stcd === sellerAddr.stcd ? Number(item.taxAmount) / 2 : 0;
            const sgstAmount = buyerAddr.stcd === sellerAddr.stcd ? Number(item.taxAmount) / 2 : 0;

            return {
                SlNo: String(index + 1),
                PrdDesc: item.productName,
                IsServc: isService,
                HsnCd: item.product?.hsnCode || '999999',
                Qty: item.quantity,
                Unit: item.product?.unit || 'NOS',
                UnitPrice: Number(item.rate),
                TotAmt: Number(item.rate) * item.quantity,
                Discount: 0, // Item level discount not implemented fully yet
                PreTaxVal: taxableValue,
                AssAmt: taxableValue,
                GstRt: Number(item.taxRate),
                IgstAmt: igstAmount,
                CgstAmt: cgstAmount,
                SgstAmt: sgstAmount,
                CesAmt: 0,
                CesNonAdvlAmt: 0,
                StateCesAmt: 0,
                TotItemVal: Number(item.total)
            };
        });

        // Calculate Value Details
        const totalCgst = itemList.reduce((sum, item) => sum + (item.CgstAmt || 0), 0);
        const totalSgst = itemList.reduce((sum, item) => sum + (item.SgstAmt || 0), 0);
        const totalIgst = itemList.reduce((sum, item) => sum + (item.IgstAmt || 0), 0);
        const totalAssVal = itemList.reduce((sum, item) => sum + item.AssAmt, 0);

        const payload: EinvoicePayload = {
            Version: "1.1",
            TranDtls: {
                TaxSch: "GST",
                SupTyp: "B2B",
                RegRev: "N",
                IgstOnIntra: "N"
            },
            DocDtls: {
                Typ: "INV",
                No: invoice.invoiceNumber,
                Dt: new Date(invoice.invoiceDate).toLocaleDateString('en-GB').split('/').reverse().join('-') // YYYY-MM-DD ? No, format is DD/MM/YYYY usually for NIC? Checking spec... Spec says DD/MM/YYYY usually. Wait.
                // Standard NIC format: "Dt": "23/09/2020"
            },
            SellerDtls: {
                Gstin: company.gstin,
                LglNm: company.legalName || company.businessName,
                TrdNm: company.businessName,
                Addr1: sellerAddr.addr1,
                Loc: sellerAddr.loc,
                Pin: sellerAddr.pin,
                Stcd: sellerAddr.stcd,
                Ph: company.phone || undefined,
                Em: company.email || undefined
            },
            BuyerDtls: {
                Gstin: customer.gstin,
                LglNm: customer.name,
                TrdNm: customer.name,
                Pos: buyerAddr.stcd, // Place of Supply State Code
                Addr1: buyerAddr.addr1,
                Loc: buyerAddr.loc,
                Pin: buyerAddr.pin,
                Stcd: buyerAddr.stcd,
                Ph: customer.phone || undefined,
                Em: customer.email || undefined
            },
            ItemList: itemList,
            ValDtls: {
                AssVal: totalAssVal,
                CgstVal: totalCgst,
                SgstVal: totalSgst,
                IgstVal: totalIgst,
                CesVal: 0,
                StCesVal: 0,
                Discount: Number(invoice.discountAmount),
                OthChrg: 0,
                RndOffAmt: Number(invoice.roundOff),
                TotInvVal: Number(invoice.totalAmount)
            }
        };

        // Correct Date Format to DD/MM/YYYY
        const d = new Date(invoice.invoiceDate);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        payload.DocDtls.Dt = `${day}/${month}/${year}`;

        return payload;
    }

    /**
     * Simulates the IRP response for a valid payload.
     * Throws errors if validation fails.
     */
    static async validateAndMockSubmit(payload: EinvoicePayload) {
        // 1. Validate Mandatory Fields
        if (!payload.SellerDtls.Gstin.match(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)) {
            throw new Error(`Invalid Seller GSTIN: ${payload.SellerDtls.Gstin}`);
        }
        if (!payload.BuyerDtls.Gstin.match(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)) {
            throw new Error(`Invalid Buyer GSTIN: ${payload.BuyerDtls.Gstin}`);
        }
        if (payload.SellerDtls.Pin < 100000 || payload.SellerDtls.Pin > 999999) {
            throw new Error(`Invalid Seller Pincode: ${payload.SellerDtls.Pin}`);
        }
        if (payload.BuyerDtls.Pin < 100000 || payload.BuyerDtls.Pin > 999999) {
            throw new Error(`Invalid Buyer Pincode: ${payload.BuyerDtls.Pin}`);
        }

        // 2. Validate Values
        const calcTotal = payload.ValDtls.AssVal + payload.ValDtls.CgstVal + payload.ValDtls.SgstVal + payload.ValDtls.IgstVal - payload.ValDtls.Discount + payload.ValDtls.RndOffAmt;
        const diff = Math.abs(calcTotal - payload.ValDtls.TotInvVal);
        if (diff > 1.00) {
            throw new Error(`Total Value Mismatch! Calculated: ${calcTotal}, Declared: ${payload.ValDtls.TotInvVal}`);
        }

        // 3. Success - Generate Mock IRN
        const crypto = require('crypto');
        const ackNo = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
        const irn = crypto.createHash('sha256').update(JSON.stringify(payload) + Date.now()).digest('hex');

        return {
            AckNo: ackNo,
            AckDt: new Date().toISOString(),
            Irn: irn,
            SignedInvoice: "mock_signed_invoice_string",
            SignedQRCode: `mock_qr_code_string_irn_${irn}`,
            Status: "ACT"
        };
    }
}
