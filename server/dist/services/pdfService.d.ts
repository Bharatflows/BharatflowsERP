import PDFDocument from 'pdfkit';
interface InvoiceItem {
    productName: string;
    quantity: number;
    rate: number;
    gstRate?: number;
    amount: number;
}
interface InvoiceData {
    invoiceNumber: string;
    invoiceDate: Date | string;
    dueDate?: Date | string;
    customer: {
        name: string;
        email?: string;
        phone?: string;
        gstNumber?: string;
        address?: string;
    };
    company: {
        businessName: string;
        legalName?: string;
        gstin?: string;
        phone?: string;
        email?: string;
        address?: any;
    };
    items: InvoiceItem[];
    subtotal: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    totalAmount: number;
    amountPaid?: number;
    balanceAmount?: number;
    notes?: string;
    terms?: string;
}
export declare function generateInvoicePDF(data: InvoiceData): InstanceType<typeof PDFDocument>;
export declare function generatePDFBuffer(data: InvoiceData): Promise<Buffer>;
export {};
//# sourceMappingURL=pdfService.d.ts.map