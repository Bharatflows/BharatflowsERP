import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

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

export function generateInvoicePDF(data: InvoiceData): InstanceType<typeof PDFDocument> {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
    });

    const primaryColor = '#1a73e8';
    const grayColor = '#666666';
    const lightGray = '#f5f5f5';

    // Header
    doc.fontSize(24)
        .fillColor(primaryColor)
        .text(data.company.businessName, 50, 50);

    doc.fontSize(10)
        .fillColor(grayColor)
        .text(`${data.company.email || ''} | ${data.company.phone || ''}`, 50, 80);

    if (data.company.gstin) {
        doc.text(`GSTIN: ${data.company.gstin}`, 50, 95);
    }

    // Invoice title
    doc.fontSize(20)
        .fillColor('#333333')
        .text('TAX INVOICE', 400, 50, { align: 'right' });

    doc.fontSize(12)
        .fillColor(primaryColor)
        .text(`#${data.invoiceNumber}`, 400, 80, { align: 'right' });

    // Dates
    doc.fontSize(10)
        .fillColor(grayColor)
        .text(`Date: ${formatDate(data.invoiceDate)}`, 400, 100, { align: 'right' });

    if (data.dueDate) {
        doc.text(`Due: ${formatDate(data.dueDate)}`, 400, 115, { align: 'right' });
    }

    // Horizontal line
    doc.moveTo(50, 140)
        .lineTo(545, 140)
        .strokeColor('#dddddd')
        .stroke();

    // Bill To
    doc.fontSize(10)
        .fillColor(grayColor)
        .text('BILL TO', 50, 160);

    doc.fontSize(12)
        .fillColor('#333333')
        .text(data.customer.name, 50, 175);

    let customerY = 190;
    if (data.customer.phone) {
        doc.fontSize(10)
            .fillColor(grayColor)
            .text(data.customer.phone, 50, customerY);
        customerY += 15;
    }
    if (data.customer.email) {
        doc.text(data.customer.email, 50, customerY);
        customerY += 15;
    }
    if (data.customer.gstNumber) {
        doc.text(`GSTIN: ${data.customer.gstNumber}`, 50, customerY);
    }

    // Items Table Header
    const tableTop = 270;
    const col1 = 50;
    const col2 = 280;
    const col3 = 350;
    const col4 = 420;
    const col5 = 490;

    // Table header background
    doc.rect(50, tableTop - 5, 495, 25)
        .fill(lightGray);

    doc.fontSize(10)
        .fillColor('#333333')
        .text('Description', col1, tableTop + 2)
        .text('Qty', col2, tableTop + 2)
        .text('Rate', col3, tableTop + 2)
        .text('GST %', col4, tableTop + 2)
        .text('Amount', col5, tableTop + 2);

    // Items
    let currentY = tableTop + 30;
    data.items.forEach((item, index) => {
        doc.fontSize(10)
            .fillColor('#333333')
            .text(item.productName, col1, currentY, { width: 220 })
            .text(item.quantity.toString(), col2, currentY)
            .text(`₹${item.rate.toFixed(2)}`, col3, currentY)
            .text(`${item.gstRate || 0}%`, col4, currentY)
            .text(`₹${item.amount.toFixed(2)}`, col5, currentY);

        currentY += 25;

        // Add page if needed
        if (currentY > 700) {
            doc.addPage();
            currentY = 50;
        }
    });

    // Totals section
    const totalsY = currentY + 30;
    doc.moveTo(50, totalsY - 10)
        .lineTo(545, totalsY - 10)
        .strokeColor('#dddddd')
        .stroke();

    doc.fontSize(10)
        .fillColor(grayColor)
        .text('Subtotal:', 380, totalsY)
        .fillColor('#333333')
        .text(`₹${data.subtotal.toFixed(2)}`, 490, totalsY, { align: 'right' });

    let taxY = totalsY + 20;
    if (data.cgst) {
        doc.fillColor(grayColor)
            .text('CGST:', 380, taxY)
            .fillColor('#333333')
            .text(`₹${data.cgst.toFixed(2)}`, 490, taxY, { align: 'right' });
        taxY += 20;
    }
    if (data.sgst) {
        doc.fillColor(grayColor)
            .text('SGST:', 380, taxY)
            .fillColor('#333333')
            .text(`₹${data.sgst.toFixed(2)}`, 490, taxY, { align: 'right' });
        taxY += 20;
    }
    if (data.igst) {
        doc.fillColor(grayColor)
            .text('IGST:', 380, taxY)
            .fillColor('#333333')
            .text(`₹${data.igst.toFixed(2)}`, 490, taxY, { align: 'right' });
        taxY += 20;
    }

    // Grand Total
    doc.rect(370, taxY + 5, 175, 30)
        .fill(primaryColor);

    doc.fontSize(12)
        .fillColor('#ffffff')
        .text('TOTAL:', 380, taxY + 13)
        .text(`₹${data.totalAmount.toFixed(2)}`, 490, taxY + 13, { align: 'right' });

    // Payment info
    if (data.amountPaid !== undefined) {
        const paymentY = taxY + 50;
        doc.fontSize(10)
            .fillColor(grayColor)
            .text('Amount Paid:', 380, paymentY)
            .fillColor('#333333')
            .text(`₹${data.amountPaid.toFixed(2)}`, 490, paymentY, { align: 'right' });

        doc.fillColor(grayColor)
            .text('Balance Due:', 380, paymentY + 20)
            .fillColor('#e74c3c')
            .text(`₹${(data.balanceAmount || 0).toFixed(2)}`, 490, paymentY + 20, { align: 'right' });
    }

    // Notes
    if (data.notes) {
        doc.fontSize(10)
            .fillColor(grayColor)
            .text('Notes:', 50, 650)
            .fillColor('#333333')
            .text(data.notes, 50, 665, { width: 300 });
    }

    // Terms
    if (data.terms) {
        doc.fontSize(10)
            .fillColor(grayColor)
            .text('Terms & Conditions:', 50, 710)
            .fillColor('#333333')
            .text(data.terms, 50, 725, { width: 300 });
    }

    // Footer
    doc.fontSize(8)
        .fillColor(grayColor)
        .text('Thank you for your business!', 50, 780, { align: 'center', width: 495 });

    return doc;
}

function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

export async function generatePDFBuffer(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = generateInvoicePDF(data);
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.end();
    });
}
