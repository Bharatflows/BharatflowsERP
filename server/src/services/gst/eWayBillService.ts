
import prisma from '../../config/prisma';

// --- E-Way Bill JSON Schema (Simplified) ---
interface EWayBillPayload {
    supplyType: "O" | "I"; // Outward/Inward
    subSupplyType: string; // 1=Supply, 2=Import, etc.
    docType: "INV" | "BIL" | "CHL" | "OTH";
    docNo: string;
    docDate: string; // dd/mm/yyyy
    fromGstin: string;
    fromTrdName: string;
    fromAddr1: string;
    fromPlace: string;
    fromPincode: number;
    fromStateCode: number;
    toGstin: string;
    toTrdName: string;
    toAddr1: string;
    toPlace: string;
    toPincode: number;
    toStateCode: number;
    totalValue: number;
    cgstValue: number;
    sgstValue: number;
    igstValue: number;
    cessValue: number;
    transporterId?: string;
    transporterName?: string;
    transDocNo?: string;
    transMode?: string; // 1=Road, 2=Rail, 3=Air, 4=Ship
    transDistance: string; // String in JSON spec? Usually number. API expects string sometimes. We'll use string to be safe or number based on library. NIC spec says number.
    vehicleNo?: string;
    vehicleType?: "R" | "O"; // Regular / ODC
    itemList: Array<{
        productName: string;
        hsnCode: number;
        quantity: number;
        qtyUnit: string;
        taxableAmount: number;
        sgstRate: number;
        cgstRate: number;
        igstRate: number;
        cessRate: number;
    }>;
}

export class GSTEWayBillService {

    /**
     * Maps database inputs to E-Way Bill JSON Schema
     */
    static async generatePayload(
        invoiceId: string,
        transportDetails: {
            transporterId?: string,
            transporterName?: string,
            vehicleNumber?: string,
            distance: number,
            mode?: string
        },
        companyId: string
    ): Promise<EWayBillPayload> {

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

        // Validation helpers (reuse from EInvoiceService essentially, but simplified here)
        const getStateCode = (gstin: string) => parseInt(gstin.substring(0, 2)) || 0;

        // Parse Adresses
        const parseAddr = (addr: any) => ({
            addr1: addr?.addressLine1 || addr?.street || "Unknown",
            place: addr?.city || "Unknown",
            pin: Number(addr?.pincode) || 0,
        });

        const fromAddr = parseAddr(company.address);
        // @ts-ignore
        const toAddr = parseAddr(customer.billingAddress);

        // Map Items
        const itemList = invoice.items.map(item => {
            const hsn = parseInt(item.product?.hsnCode || "0") || 999999;
            const taxable = Number(item.total) - Number(item.taxAmount);
            // Simplified tax rate split assuming intra-state for now or handle logic
            const isIntra = getStateCode(company.gstin!) === getStateCode(customer.gstin!);

            return {
                productName: item.productName,
                hsnCode: hsn,
                quantity: item.quantity,
                qtyUnit: item.product?.unit || "NOS",
                taxableAmount: taxable,
                sgstRate: isIntra ? Number(item.taxRate) / 2 : 0,
                cgstRate: isIntra ? Number(item.taxRate) / 2 : 0,
                igstRate: !isIntra ? Number(item.taxRate) : 0,
                cessRate: 0
            };
        });

        const totalTax = invoice.items.reduce((sum, i) => sum + Number(i.taxAmount), 0);
        const isIntra = getStateCode(company.gstin!) === getStateCode(customer.gstin!);

        const formattedDate = new Date(invoice.invoiceDate).toLocaleDateString('en-GB'); // dd/mm/yyyy

        const payload: EWayBillPayload = {
            supplyType: "O",
            subSupplyType: "1", // Supply
            docType: "INV",
            docNo: invoice.invoiceNumber,
            docDate: formattedDate,
            fromGstin: company.gstin!,
            fromTrdName: company.businessName,
            fromAddr1: fromAddr.addr1,
            fromPlace: fromAddr.place,
            fromPincode: fromAddr.pin,
            fromStateCode: getStateCode(company.gstin!),
            toGstin: customer.gstin!,
            toTrdName: customer.name,
            toAddr1: toAddr.addr1,
            toPlace: toAddr.place,
            toPincode: toAddr.pin,
            toStateCode: getStateCode(customer.gstin!),
            totalValue: Number(invoice.totalAmount),
            cgstValue: isIntra ? totalTax / 2 : 0,
            sgstValue: isIntra ? totalTax / 2 : 0,
            igstValue: !isIntra ? totalTax : 0,
            cessValue: 0,
            transporterId: transportDetails.transporterId,
            transporterName: transportDetails.transporterName,
            transDistance: String(transportDetails.distance),
            vehicleNo: transportDetails.vehicleNumber,
            vehicleType: "R", // Regular
            itemList
        };

        return payload;
    }

    /**
     * Validate and Mock Submit
     */
    static async validateAndMockSubmit(payload: EWayBillPayload) {
        // 1. Mandatory Checks for Part A
        if (!payload.fromGstin || !payload.toGstin) throw new Error("GSTINs required");
        if (Number(payload.transDistance) <= 0) throw new Error("Distance must be > 0");

        // 2. Mandatory Checks for Part B (Vehicle)
        if (!payload.transporterId && !payload.vehicleNo) {
            throw new Error("Either Transporter ID or Vehicle Number is required");
        }

        // Mock Response
        const ewbNo = Math.floor(100000000000 + Math.random() * 900000000000).toString();

        return {
            ewayBillNo: ewbNo,
            ewayBillDate: new Date().toISOString(),
            validUpto: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: "GENERATED"
        };
    }
}
