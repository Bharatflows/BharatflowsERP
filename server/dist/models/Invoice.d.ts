import mongoose, { Document } from 'mongoose';
export interface IInvoice extends Document {
    companyId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    invoiceNumber: string;
    invoiceType: 'tax_invoice' | 'proforma' | 'export';
    customerId: mongoose.Types.ObjectId;
    customerName: string;
    customerGSTIN?: string;
    customerAddress: object;
    invoiceDate: Date;
    dueDate?: Date;
    placeOfSupply: string;
    items: Array<{
        productId: mongoose.Types.ObjectId;
        productName: string;
        hsnCode?: string;
        quantity: number;
        unit: string;
        rate: number;
        discount: number;
        taxableAmount: number;
        gstRate: number;
        cgst: number;
        sgst: number;
        igst: number;
        cess: number;
        totalAmount: number;
    }>;
    subtotal: number;
    totalDiscount: number;
    totalTaxableAmount: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    totalTax: number;
    roundOff: number;
    grandTotal: number;
    amountPaid: number;
    balanceAmount: number;
    status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
    paymentTerms?: string;
    notes?: string;
    termsAndConditions?: string;
    attachments: string[];
    eInvoiceDetails?: {
        irn: string;
        ackNo: string;
        ackDate: Date;
        qrCode: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IInvoice, {}, {}, {}, mongoose.Document<unknown, {}, IInvoice, {}, {}> & IInvoice & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Invoice.d.ts.map