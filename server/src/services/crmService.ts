import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const prisma = new PrismaClient();

export class CRMService {
    /**
     * Calculate Customer Credit Score (0-100)
     * Scores based on:
     * 1. Payment Timeliness (50%): Penalize for late payments
     * 2. Purchase Volume (30%): Higher volume -> Higher score
     * 3. Relationship Loyalty (20%): Time since first order
     */
    static async calculateCustomerScore(companyId: string, customerId: string): Promise<number> {
        try {
            // 1. Fetch Invoices History
            const invoices = await prisma.invoice.findMany({
                where: {
                    companyId,
                    customerId,
                    status: 'PAID'
                },
                include: {
                    receiptAllocations: {
                        include: {
                            receipt: true
                        }
                    }
                }
            });

            if (invoices.length === 0) return 0;

            // --- FACTOR 1: PAYMENT TIMELINESS (50 pts) ---
            let totalDelayDays = 0;
            let onTimeCount = 0;

            for (const inv of invoices) {
                if (!inv.dueDate) {
                    onTimeCount++; // Assume on time if no due date
                    continue;
                }
                // Use last payment date as effectively paid date
                // Sort allocations by date
                const sortedAllocations = inv.receiptAllocations.sort((a, b) =>
                    new Date(a.receipt.date).getTime() - new Date(b.receipt.date).getTime()
                );

                const paidDate = sortedAllocations.length > 0
                    ? sortedAllocations[sortedAllocations.length - 1].receipt.date
                    : inv.updatedAt;

                const diffTime = new Date(paidDate as Date).getTime() - new Date(inv.dueDate).getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 0) {
                    onTimeCount++;
                } else {
                    totalDelayDays += diffDays;
                }
            }

            const onTimeRatio = onTimeCount / invoices.length;
            const factor1 = Math.round(onTimeRatio * 50);


            // --- FACTOR 2: PURCHASE VOLUME (30 pts) ---
            const totalSpent = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
            // Dynamic threshold? Let's say > 1 Lakh is max score (30) for small MSME context
            // Adjust threshold based on business context if needed.
            const maxVolumeThreshold = 100000;
            const factor2 = Math.min(30, Math.round((totalSpent / maxVolumeThreshold) * 30));


            // --- FACTOR 3: RELATIONSHIP AGE (20 pts) ---
            // Time between first invoice and now
            const firstInvoice = invoices[invoices.length - 1]; // Assuming default sort? No, usually most recent first.
            // Let's sort to be sure
            invoices.sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());

            const firstDate = new Date(invoices[0].invoiceDate);
            const now = new Date();
            const monthsActive = (now.getFullYear() - firstDate.getFullYear()) * 12 + (now.getMonth() - firstDate.getMonth());

            // > 12 months = max score (20)
            const factor3 = Math.min(20, Math.round((monthsActive / 12) * 20));

            const totalScore = factor1 + factor2 + factor3;

            // Update Party
            await prisma.party.update({
                where: { id: customerId, companyId },
                data: { creditScore: totalScore }
            });

            return totalScore;
        } catch (error: any) {
            logger.error(`Error calculating CRM score for ${customerId}: ${error.message}`);
            return 0;
        }
    }
}
