/**
 * Vendor Scoring Service
 * Scores vendors on payment reliability, delivery speed, and quality
 */
import prisma from '../config/prisma';

export class VendorScoringService {
    /**
     * Calculate vendor score for a given party (supplier)
     * Scoring dimensions:
     *   - Payment reliability: % of invoices paid on or before due date
     *   - Response time: Average days between invoice date and payment date
     *   - Volume consistency: Regularity of orders over last 6 months
     *   - Returns rate: % of credit notes / returns vs total invoices
     */
    static async getVendorScore(partyId: string, companyId: string) {
        // Get all purchase bills from this vendor
        const bills = await prisma.purchaseBill.findMany({
            where: {
                companyId,
                supplierId: partyId,
                deletedAt: null,
            },
            select: {
                id: true,
                billDate: true,
                dueDate: true,
                updatedAt: true,
                status: true,
                totalAmount: true,
                balanceAmount: true,
            },
            orderBy: { billDate: 'desc' },
        });

        const invoices = bills.map(b => ({
            id: b.id,
            invoiceDate: b.billDate,
            dueDate: b.dueDate,
            paidDate: b.status === 'PAID' || Number(b.balanceAmount) <= 0 ? b.updatedAt : null,
            status: b.status,
            totalAmount: b.totalAmount,
            balanceAmount: b.balanceAmount
        }));

        if (invoices.length === 0) {
            return {
                partyId,
                totalInvoices: 0,
                overallScore: 0,
                tier: 'UNRATED',
                dimensions: {
                    paymentReliability: 0,
                    responseTime: 0,
                    volumeConsistency: 0,
                    qualityScore: 100,
                },
            };
        }

        // Payment reliability: % paid on time
        const paidInvoices = invoices.filter(i => i.paidDate);
        const onTimePayments = paidInvoices.filter(i => {
            if (!i.dueDate || !i.paidDate) return false;
            return new Date(i.paidDate) <= new Date(i.dueDate);
        });
        const paymentReliability = paidInvoices.length > 0
            ? Math.round((onTimePayments.length / paidInvoices.length) * 100)
            : 50; // Neutral if no payments yet

        // Response time: avg days to pay
        const paymentDays = paidInvoices
            .filter(i => i.invoiceDate && i.paidDate)
            .map(i => {
                const diff = new Date(i.paidDate!).getTime() - new Date(i.invoiceDate).getTime();
                return Math.max(0, diff / (1000 * 60 * 60 * 24));
            });
        const avgPaymentDays = paymentDays.length > 0
            ? Math.round(paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length)
            : 30;
        const responseTimeScore = Math.max(0, Math.min(100, 100 - (avgPaymentDays - 15) * 2));

        // Volume consistency: orders per month over last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recentInvoices = invoices.filter(i => new Date(i.invoiceDate) >= sixMonthsAgo);
        const monthsWithOrders = new Set(
            recentInvoices.map(i => `${new Date(i.invoiceDate).getFullYear()}-${new Date(i.invoiceDate).getMonth()}`)
        ).size;
        const volumeConsistency = Math.round((monthsWithOrders / 6) * 100);

        // Overall score (weighted)
        const overallScore = Math.round(
            paymentReliability * 0.4 +
            responseTimeScore * 0.3 +
            volumeConsistency * 0.2 +
            100 * 0.1 // Quality placeholder
        );

        // Tier
        let tier = 'BRONZE';
        if (overallScore >= 90) tier = 'PLATINUM';
        else if (overallScore >= 75) tier = 'GOLD';
        else if (overallScore >= 55) tier = 'SILVER';

        return {
            partyId,
            totalInvoices: invoices.length,
            totalVolume: invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0),
            avgPaymentDays,
            overallScore,
            tier,
            dimensions: {
                paymentReliability,
                responseTime: responseTimeScore,
                volumeConsistency,
                qualityScore: 100, // Placeholder until review system
            },
        };
    }

    /**
     * Get top scored vendors for a company
     */
    static async getTopVendors(companyId: string, limit: number = 10) {
        const suppliers = await prisma.party.findMany({
            where: { companyId, type: { in: ['SUPPLIER', 'BOTH'] } },
            select: { id: true, name: true },
            take: 50,
        });

        const scored = await Promise.all(
            suppliers.map(async (s) => ({
                ...s,
                score: await this.getVendorScore(s.id, companyId),
            }))
        );

        return scored
            .sort((a, b) => b.score.overallScore - a.score.overallScore)
            .slice(0, limit);
    }
}
