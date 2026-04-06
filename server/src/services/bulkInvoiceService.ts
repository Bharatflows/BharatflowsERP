/**
 * Bulk Invoice Service
 * Handles CSV parsing, validation preview, and batch invoice creation
 */
import prisma from '../config/prisma';
import logger from '../config/logger';

interface BulkInvoiceRow {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    customerName: string;
    customerGSTIN?: string;
    items: string; // JSON string: [{ productName, quantity, rate, taxRate }]
    notes?: string;
}

interface ValidationError {
    row: number;
    field: string;
    message: string;
}

interface ParsedInvoice {
    row: number;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate?: Date;
    customerName: string;
    customerGSTIN?: string;
    items: Array<{
        productName: string;
        quantity: number;
        rate: number;
        taxRate: number;
        taxAmount: number;
        total: number;
    }>;
    subtotal: number;
    totalTax: number;
    totalAmount: number;
    notes?: string;
    valid: boolean;
    errors: ValidationError[];
}

export class BulkInvoiceService {
    /**
     * Parse and validate CSV rows into invoice data
     * Returns a preview with validation results (doesn't save anything)
     */
    static async validateBulk(
        rows: Record<string, string>[],
        companyId: string
    ): Promise<{ invoices: ParsedInvoice[]; validCount: number; errorCount: number; errors: ValidationError[] }> {
        const invoices: ParsedInvoice[] = [];
        const allErrors: ValidationError[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // +2 for header row + 0-index
            const errors: ValidationError[] = [];

            // Required field validation
            if (!row.invoiceNumber?.trim()) errors.push({ row: rowNum, field: 'invoiceNumber', message: 'Invoice number is required' });
            if (!row.invoiceDate?.trim()) errors.push({ row: rowNum, field: 'invoiceDate', message: 'Invoice date is required' });
            if (!row.customerName?.trim()) errors.push({ row: rowNum, field: 'customerName', message: 'Customer name is required' });

            // Date validation
            const invoiceDate = new Date(row.invoiceDate);
            const dueDate = row.dueDate ? new Date(row.dueDate) : undefined;
            if (row.invoiceDate && isNaN(invoiceDate.getTime())) {
                errors.push({ row: rowNum, field: 'invoiceDate', message: 'Invalid date format' });
            }
            if (row.dueDate && dueDate && isNaN(dueDate.getTime())) {
                errors.push({ row: rowNum, field: 'dueDate', message: 'Invalid due date format' });
            }

            // GSTIN validation (if provided)
            if (row.customerGSTIN && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(row.customerGSTIN.trim().toUpperCase())) {
                errors.push({ row: rowNum, field: 'customerGSTIN', message: 'Invalid GSTIN format' });
            }

            // Duplicate invoice number check
            const existingInvoice = await prisma.invoice.findFirst({
                where: { companyId, invoiceNumber: row.invoiceNumber?.trim() },
            });
            if (existingInvoice) {
                errors.push({ row: rowNum, field: 'invoiceNumber', message: `Invoice ${row.invoiceNumber} already exists` });
            }

            // Parse items
            let parsedItems: Array<{ productName: string; quantity: number; rate: number; taxRate: number; taxAmount: number; total: number }> = [];
            try {
                const rawItems = JSON.parse(row.items || '[]');
                parsedItems = rawItems.map((item: any, idx: number) => {
                    if (!item.productName) errors.push({ row: rowNum, field: `items[${idx}].productName`, message: 'Product name required' });
                    if (!item.quantity || item.quantity <= 0) errors.push({ row: rowNum, field: `items[${idx}].quantity`, message: 'Quantity must be > 0' });
                    if (!item.rate || item.rate <= 0) errors.push({ row: rowNum, field: `items[${idx}].rate`, message: 'Rate must be > 0' });

                    const qty = Number(item.quantity) || 0;
                    const rate = Number(item.rate) || 0;
                    const taxRate = Number(item.taxRate) || 0;
                    const lineTotal = qty * rate;
                    const taxAmount = lineTotal * (taxRate / 100);

                    return {
                        productName: item.productName || '',
                        quantity: qty,
                        rate,
                        taxRate,
                        taxAmount: Math.round(taxAmount * 100) / 100,
                        total: Math.round((lineTotal + taxAmount) * 100) / 100,
                    };
                });
            } catch {
                errors.push({ row: rowNum, field: 'items', message: 'Invalid items JSON format' });
            }

            if (parsedItems.length === 0 && !errors.some(e => e.field === 'items')) {
                errors.push({ row: rowNum, field: 'items', message: 'At least one item is required' });
            }

            const subtotal = parsedItems.reduce((s, item) => s + (item.quantity * item.rate), 0);
            const totalTax = parsedItems.reduce((s, item) => s + item.taxAmount, 0);

            const invoice: ParsedInvoice = {
                row: rowNum,
                invoiceNumber: row.invoiceNumber?.trim() || '',
                invoiceDate: invoiceDate,
                dueDate,
                customerName: row.customerName?.trim() || '',
                customerGSTIN: row.customerGSTIN?.trim(),
                items: parsedItems,
                subtotal: Math.round(subtotal * 100) / 100,
                totalTax: Math.round(totalTax * 100) / 100,
                totalAmount: Math.round((subtotal + totalTax) * 100) / 100,
                notes: row.notes?.trim(),
                valid: errors.length === 0,
                errors,
            };

            invoices.push(invoice);
            allErrors.push(...errors);
        }

        return {
            invoices,
            validCount: invoices.filter(i => i.valid).length,
            errorCount: invoices.filter(i => !i.valid).length,
            errors: allErrors,
        };
    }

    /**
     * Commit validated invoices to the database
     * Only processes invoices that passed validation
     */
    static async commitBulk(
        invoices: ParsedInvoice[],
        companyId: string,
        userId: string
    ): Promise<{ created: number; skipped: number; errors: string[] }> {
        let created = 0;
        let skipped = 0;
        const errors: string[] = [];

        const validInvoices = invoices.filter(i => i.valid);

        for (const inv of validInvoices) {
            try {
                // Find or create customer
                let customer = await prisma.party.findFirst({
                    where: { companyId, name: inv.customerName },
                });

                if (!customer) {
                    customer = await prisma.party.create({
                        data: {
                            companyId,
                            name: inv.customerName,
                            type: 'CUSTOMER',
                            gstin: inv.customerGSTIN,
                        },
                    });
                }

                // Create invoice with items
                await prisma.invoice.create({
                    data: {
                        companyId,
                        userId,
                        customerId: customer.id,
                        invoiceNumber: inv.invoiceNumber,
                        invoiceDate: inv.invoiceDate,
                        dueDate: inv.dueDate,
                        subtotal: inv.subtotal,
                        totalTax: inv.totalTax,
                        totalAmount: inv.totalAmount,
                        balanceAmount: inv.totalAmount,
                        status: 'DRAFT',
                        notes: inv.notes,
                        items: {
                            create: inv.items.map(item => ({
                                productName: item.productName,
                                quantity: item.quantity,
                                rate: item.rate,
                                taxRate: item.taxRate,
                                taxAmount: item.taxAmount,
                                total: item.total,
                            })),
                        },
                    },
                });

                created++;
            } catch (err: any) {
                errors.push(`Row ${inv.row}: ${err.message}`);
                skipped++;
            }
        }

        logger.info(`Bulk invoice import: ${created} created, ${skipped} skipped, ${invoices.length - validInvoices.length} invalid`);
        return { created, skipped, errors };
    }
}
