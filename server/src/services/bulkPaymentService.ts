/**
 * Bulk Payment Scheduling Service
 * Queue outgoing payments with approval workflow integration
 */
import prisma from '../config/prisma';
import logger from '../config/logger';
import { eventBus, EventTypes } from './eventBus';

export type PaymentBatchStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface PaymentItem {
    invoiceId: string;
    partyId: string;
    amount: number;
    paymentMethod?: string;
}

export class BulkPaymentService {
    /**
     * Create a payment batch
     */
    static async createBatch(companyId: string, userId: string, items: PaymentItem[], scheduledDate?: Date) {
        const totalAmount = items.reduce((s, i) => s + i.amount, 0);

        // Validate invoices exist and have balance
        const invoiceIds = items.map(i => i.invoiceId);
        const invoices = await prisma.invoice.findMany({
            where: { id: { in: invoiceIds }, companyId, deletedAt: null },
            select: { id: true, balanceAmount: true, invoiceNumber: true },
        });
        const invoiceMap = new Map(invoices.map(i => [i.id, i]));
        const errors: string[] = [];
        items.forEach(item => {
            const inv = invoiceMap.get(item.invoiceId);
            if (!inv) errors.push(`Invoice ${item.invoiceId} not found`);
            else if (item.amount > Number(inv.balanceAmount)) errors.push(`Amount exceeds balance for ${inv.invoiceNumber}`);
        });
        if (errors.length > 0) throw new Error(`Validation errors: ${errors.join(', ')}`);

        // Store batch
        const batch = await prisma.settingsAuditLog.create({
            data: {
                companyId, userId,
                action: 'BULK_PAYMENT_BATCH',
                settingType: 'payments',
                fieldName: 'batch',
                oldValue: JSON.stringify({
                    items,
                    totalAmount,
                    scheduledDate: scheduledDate?.toISOString(),
                    itemCount: items.length,
                }),
                newValue: 'DRAFT' as PaymentBatchStatus,
            },
        });

        logger.info(`[BulkPay] Batch ${batch.id} created: ${items.length} items, ₹${totalAmount}`);
        return { batchId: batch.id, itemCount: items.length, totalAmount, status: 'DRAFT' };
    }

    /**
     * Submit batch for approval
     */
    static async submitForApproval(batchId: string, companyId: string, userId: string) {
        const batch = await prisma.settingsAuditLog.findFirst({
            where: { id: batchId, companyId, action: 'BULK_PAYMENT_BATCH' },
        });
        if (!batch) throw new Error('Batch not found');
        if (batch.newValue !== 'DRAFT') throw new Error('Batch is not in draft status');

        await prisma.settingsAuditLog.update({
            where: { id: batchId },
            data: { newValue: 'PENDING_APPROVAL' },
        });

        // Create approval request
        const batchData = JSON.parse(batch.oldValue || '{}');
        await prisma.approvalRequest.create({
            data: {
                companyId,
                requestedById: userId,
                entityType: 'BULK_PAYMENT',
                entityId: batchId,
                amount: batchData.totalAmount,
                status: 'PENDING',
                comments: `Bulk payment batch: ${batchData.itemCount} items, ₹${batchData.totalAmount}`,
            },
        });

        return { batchId, status: 'PENDING_APPROVAL' };
    }

    /**
     * Get batch details
     */
    static async getBatch(batchId: string, companyId: string) {
        const batch = await prisma.settingsAuditLog.findFirst({
            where: { id: batchId, companyId, action: 'BULK_PAYMENT_BATCH' },
        });
        if (!batch) return null;
        const data = JSON.parse(batch.oldValue || '{}');
        return {
            batchId: batch.id,
            ...data,
            status: batch.newValue,
            createdAt: batch.timestamp,
            createdBy: batch.userId,
        };
    }

    /**
     * List batches
     */
    static async listBatches(companyId: string, status?: PaymentBatchStatus) {
        const where: any = { companyId, action: 'BULK_PAYMENT_BATCH' };
        if (status) where.newValue = status;
        const batches = await prisma.settingsAuditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: 50,
        });
        return batches.map(b => {
            const data = JSON.parse(b.oldValue || '{}');
            return { batchId: b.id, ...data, status: b.newValue, createdAt: b.timestamp };
        });
    }
}
