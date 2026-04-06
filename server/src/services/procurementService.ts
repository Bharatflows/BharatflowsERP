
import { PrismaClient, RFQ, SupplierQuote, PurchaseOrder } from '@prisma/client';
import eventBus, { EventTypes } from './eventBus';
import logger from '../config/logger';

const prisma = new PrismaClient();

interface RFQData {
    companyId: string;
    deadline: Date;
    notes?: string;
    items: {
        productId: string | null;
        productName: string;
        quantity: number;
        description?: string;
    }[];
    supplierIds?: string[];
}

interface QuoteData {
    companyId: string;
    rfqId: string;
    supplierId: string;
    quoteNumber: string;
    quoteDate: Date;
    validUntil?: Date;
    items: {
        productId: string | null;
        productName: string;
        quantity: number;
        rate: number;
        taxRate: number;
        deliveryDate?: Date;
    }[];
}

class ProcurementService {
    /**
     * Create a new Request for Quotation (RFQ)
     */
    async createRFQ(data: RFQData): Promise<RFQ> {
        return await prisma.$transaction(async (tx) => {
            // Generate RFQ Number
            const count = await tx.rFQ.count({ where: { companyId: data.companyId } });
            const rfqNumber = `RFQ-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

            const rfq = await tx.rFQ.create({
                data: {
                    rfqNumber,
                    companyId: data.companyId,
                    deadline: data.deadline,
                    notes: data.notes,
                    items: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            description: item.description
                        }))
                    }
                },
                include: { items: true }
            });

            // If suppliers are invited, we could track that or send emails here
            if (data.supplierIds && data.supplierIds.length > 0) {
                // Future: Create invites or send emails
                logger.info(`[Procurement] Invited ${data.supplierIds.length} suppliers to RFQ ${rfqNumber}`);
            }

            await eventBus.emit({
                companyId: data.companyId,
                eventType: EventTypes.RFQ_CREATED,
                aggregateType: 'RFQ',
                aggregateId: rfq.id,
                payload: { rfqNumber, itemsCount: data.items.length },
                metadata: { userId: 'system', source: 'system' }
            });

            return rfq;
        });
    }

    /**
     * Record a Supplier Quote against an RFQ
     */
    async recordSupplierQuote(data: QuoteData): Promise<SupplierQuote> {
        return await prisma.$transaction(async (tx) => {
            // Calculate totals
            let subtotal = 0;
            let totalTax = 0;

            const itemsWithTotals = data.items.map(item => {
                const total = item.quantity * item.rate;
                const taxAmount = (total * item.taxRate) / 100;
                subtotal += total;
                totalTax += taxAmount;
                return {
                    ...item,
                    taxAmount,
                    total: total + taxAmount
                };
            });

            const totalAmount = subtotal + totalTax;

            const quote = await tx.supplierQuote.create({
                data: {
                    companyId: data.companyId,
                    rfqId: data.rfqId,
                    supplierId: data.supplierId,
                    quoteNumber: data.quoteNumber,
                    quoteDate: data.quoteDate,
                    validUntil: data.validUntil,
                    subtotal,
                    taxAmount: totalTax,
                    totalAmount,
                    items: {
                        create: itemsWithTotals
                    }
                },
                include: { items: true }
            });

            await eventBus.emit({
                companyId: data.companyId,
                eventType: EventTypes.SUPPLIER_QUOTE_RECEIVED,
                aggregateType: 'SupplierQuote',
                aggregateId: quote.id,
                payload: { rfqId: data.rfqId, supplierId: data.supplierId, amount: totalAmount },
                metadata: { userId: 'system', source: 'system' }
            });

            return quote;
        });
    }

    /**
     * Compare Quotes for an RFQ
     * simple ranking by Total Amount
     */
    async compareQuotes(rfqId: string, companyId: string) {
        const quotes = await prisma.supplierQuote.findMany({
            where: { rfqId, companyId },
            include: { supplier: true, items: true },
            orderBy: { totalAmount: 'asc' } // Lowest price first
        });

        return quotes.map(quote => ({
            id: quote.id,
            supplierName: quote.supplier.name,
            totalAmount: quote.totalAmount,
            validUntil: quote.validUntil,
            rank: 0 // To be filled by frontend or complex logic
        }));
    }

    /**
     * Convert Accepted Quote to Purchase Order
     */
    async generatePOFromQuote(quoteId: string, companyId: string): Promise<PurchaseOrder> {
        return await prisma.$transaction(async (tx) => {
            const quote = await tx.supplierQuote.findUnique({
                where: { id: quoteId, companyId },
                include: { items: true, rfq: true }
            });

            if (!quote) throw new Error('Quote not found');

            // Update Quote Status
            await tx.supplierQuote.update({
                where: { id: quoteId },
                data: { status: 'ACCEPTED' }
            });

            // Update RFQ Status if fully met? (Optional logic)
            // await tx.rFQ.update({ where: { id: quote.rfqId }, data: { status: 'CLOSED' } });

            // Generate PO Number
            const count = await tx.purchaseOrder.count({ where: { companyId } });
            const orderNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

            // Create PO
            const po = await tx.purchaseOrder.create({
                data: {
                    companyId,
                    orderNumber,
                    supplierId: quote.supplierId,
                    quoteId: quote.id,
                    rfqId: quote.rfqId,
                    orderDate: new Date(),
                    subtotal: quote.subtotal,
                    totalTax: quote.taxAmount,
                    totalAmount: quote.totalAmount,
                    status: 'DRAFT',
                    items: {
                        create: quote.items.map(item => ({
                            productName: item.productName,
                            productId: item.productId,
                            quantity: item.quantity,
                            rate: item.rate,
                            taxRate: item.taxRate,
                            taxAmount: item.taxAmount,
                            total: item.total
                            // Note: PO/Bill item schema might differ slightly on tax details (CGST/SGST), 
                            // here we map basic fields.
                        }))
                    }
                }
            });

            await eventBus.emit({
                companyId,
                eventType: EventTypes.PURCHASE_ORDER_CREATED,
                aggregateType: 'PurchaseOrder',
                aggregateId: po.id,
                payload: { orderNumber, source: 'QUOTE', quoteId },
                metadata: { userId: 'system', source: 'system' }
            });

            return po;
        });
    }
}

export default new ProcurementService();
