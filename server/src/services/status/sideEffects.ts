import prisma from '../../config/prisma';
import logger from '../../config/logger';

export class StatusSideEffects {
    
    /**
     * Restore stock when an invoice is cancelled
     */
    static async restoreInvoiceStock(invoiceId: string, companyId: string, tx: any) {
        const invoice = await tx.invoice.findUnique({
            where: { id: invoiceId },
            include: { items: true }
        });

        if (!invoice) return;

        for (const item of invoice.items) {
            if (item.productId) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { currentStock: { increment: item.quantity } }
                });

                await tx.stockMovement.create({
                    data: {
                        companyId,
                        productId: item.productId,
                        type: 'RETURN',
                        quantity: item.quantity,
                        reference: invoice.invoiceNumber,
                        reason: `Invoice Cancelled: ${invoice.invoiceNumber}`,
                        createdBy: 'system' // or pass user
                    }
                });
            }
        }
        logger.info(`[StatusEngine] Restored stock for cancelled invoice ${invoice.invoiceNumber}`);
    }

    /**
     * Convert Lead to Party when WON
     */
    static async convertLeadToParty(leadId: string, companyId: string, tx: any) {
        const lead = await tx.lead.findUnique({ where: { id: leadId } });
        if (!lead) return;

        // Check if party exists (by email) or create new
        // Basic implementation for now
        // This is complex, might need more details. Skipping auto-conversion for now in this MVP step unless critical.
    }
}
