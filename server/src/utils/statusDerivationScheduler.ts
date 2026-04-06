import prisma from '../config/prisma';
import logger from '../config/logger';

/**
 * Status Derivation Scheduler
 * 
 * Runs periodically to update status based on derived rules:
 * - Mark Invoices as OVERDUE if: dueDate < today AND balanceAmount > 0 AND status not in [PAID, CANCELLED]
 * - Mark PurchaseBills as OVERDUE if: dueDate < today AND balanceAmount > 0 AND status not in [PAID, CANCELLED]
 * 
 * This ensures statuses are accurate even if Receipt/Payment events weren't processed.
 */
export async function deriveOverdueStatuses(): Promise<void> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        logger.info('⏰ Running Overdue status derivation...');

        // Fetch all companies to iterate over, as tenant isolation requires companyId
        const companies = await prisma.company.findMany({ select: { id: true } });

        let totalOverdueInvoices = 0;
        let totalOverdueBills = 0;

        for (const company of companies) {
            // 1. Update Overdue Invoices per company
            const overdueInvoices = await prisma.invoice.updateMany({
                where: {
                    companyId: company.id,
                    dueDate: { lt: today },
                    balanceAmount: { gt: 0.01 },
                    status: { notIn: ['PAID', 'CANCELLED', 'OVERDUE'] },
                    deletedAt: null
                },
                data: {
                    status: 'OVERDUE'
                }
            });

            totalOverdueInvoices += overdueInvoices.count;

            // 2. Update Overdue Purchase Bills per company
            const overdueBills = await prisma.purchaseBill.updateMany({
                where: {
                    companyId: company.id,
                    dueDate: { lt: today },
                    balanceAmount: { gt: 0.01 },
                    status: { notIn: ['PAID', 'CANCELLED', 'OVERDUE'] }
                },
                data: {
                    status: 'OVERDUE'
                }
            });

            totalOverdueBills += overdueBills.count;
        }

        if (totalOverdueInvoices > 0) {
            logger.info(`📄 Marked ${totalOverdueInvoices} invoice(s) as OVERDUE`);
        }

        if (totalOverdueBills > 0) {
            logger.info(`📦 Marked ${totalOverdueBills} purchase bill(s) as OVERDUE`);
        }

        logger.info('✅ Overdue status derivation complete');

    } catch (error: any) {
        logger.error('❌ Error deriving overdue statuses:', error.message);
    }
}

/**
 * Schedule to run daily at 1 AM to derive overdue statuses.
 */
export function scheduleOverdueDerivation(): void {
    // Run immediately on startup for initial sync
    deriveOverdueStatuses();

    // Schedule to run every day at 1 AM
    const msUntil1AM = getMillisecondsUntil1AM();

    setTimeout(() => {
        deriveOverdueStatuses();
        // Then run every 24 hours
        setInterval(deriveOverdueStatuses, 24 * 60 * 60 * 1000);
    }, msUntil1AM);

    logger.info(`📅 Overdue derivation scheduled (next run in ${Math.round(msUntil1AM / 1000 / 60)} minutes)`);
}

function getMillisecondsUntil1AM(): number {
    const now = new Date();
    const target = new Date(now);
    target.setHours(1, 0, 0, 0);

    // If 1 AM has already passed today, schedule for tomorrow
    if (now >= target) {
        target.setDate(target.getDate() + 1);
    }

    return target.getTime() - now.getTime();
}
