/**
 * Payment Term Analyzer Service
 * Analyzes and compares payment terms across suppliers/customers
 */
import prisma from '../config/prisma';

export class PaymentTermAnalyzerService {
    /**
     * Analyze payment terms for all parties of a given type
     */
    static async analyzePaymentTerms(companyId: string, partyType: 'CUSTOMER' | 'SUPPLIER' = 'SUPPLIER') {
        const parties = await prisma.party.findMany({
            where: {
                companyId,
                type: { in: partyType === 'SUPPLIER' ? ['SUPPLIER', 'BOTH'] : ['CUSTOMER', 'BOTH'] },
            },
            select: { id: true, name: true, creditPeriod: true },
        });

        const analysis = await Promise.all(
            parties.map(async (party) => {
                let invoices: any[] = [];
                if (partyType === 'SUPPLIER') {
                    const bills = await prisma.purchaseBill.findMany({
                        where: {
                            companyId,
                            supplierId: party.id,
                            deletedAt: null,
                        },
                        select: { billDate: true, dueDate: true, updatedAt: true, totalAmount: true, status: true },
                        orderBy: { billDate: 'desc' },
                        take: 50,
                    });
                    invoices = bills.map(b => ({
                        invoiceDate: b.billDate,
                        dueDate: b.dueDate,
                        paidDate: b.status === 'PAID' ? b.updatedAt : null,
                        totalAmount: b.totalAmount,
                        status: b.status
                    }));
                } else {
                    const invs = await prisma.invoice.findMany({
                        where: {
                            companyId,
                            customerId: party.id,
                            deletedAt: null,
                        },
                        select: { invoiceDate: true, dueDate: true, updatedAt: true, totalAmount: true, status: true },
                        orderBy: { invoiceDate: 'desc' },
                        take: 50,
                    });
                    invoices = invs.map(i => ({
                        invoiceDate: i.invoiceDate,
                        dueDate: i.dueDate,
                        paidDate: i.status === 'PAID' ? i.updatedAt : null,
                        totalAmount: i.totalAmount,
                        status: i.status
                    }));
                }

                if (invoices.length === 0) return null;

                // Calculate actual payment days
                const paidInvoices = invoices.filter(i => i.paidDate);
                const paymentDays = paidInvoices.map(i => {
                    const diff = new Date(i.paidDate!).getTime() - new Date(i.invoiceDate).getTime();
                    return Math.max(0, diff / (1000 * 60 * 60 * 24));
                });

                const avgActualDays = paymentDays.length > 0
                    ? Math.round(paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length)
                    : null;

                // Nominal terms
                const nominalTermDays = party.creditPeriod || 30;
                const dueDays = invoices
                    .filter(i => i.dueDate)
                    .map(i => {
                        const diff = new Date(i.dueDate!).getTime() - new Date(i.invoiceDate).getTime();
                        return Math.round(diff / (1000 * 60 * 60 * 24));
                    });
                const avgNominalDays = dueDays.length > 0
                    ? Math.round(dueDays.reduce((a, b) => a + b, 0) / dueDays.length)
                    : nominalTermDays;

                // Variance
                const variance = avgActualDays !== null ? avgActualDays - avgNominalDays : 0;

                // Total outstanding
                const outstanding = invoices
                    .filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED')
                    .reduce((sum, i) => sum + Number(i.totalAmount), 0);

                // Overdue count
                const overdueCount = invoices.filter(i =>
                    i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'PAID'
                ).length;

                return {
                    partyId: party.id,
                    partyName: party.name,
                    nominalTermDays: avgNominalDays,
                    actualAvgDays: avgActualDays,
                    variance,
                    varianceLabel: variance > 5 ? 'SLOW_PAYER' : variance < -5 ? 'EARLY_PAYER' : 'ON_TIME',
                    totalInvoices: invoices.length,
                    paidInvoices: paidInvoices.length,
                    overdueCount,
                    outstandingAmount: outstanding,
                    recommendation: this.getRecommendation(variance, overdueCount, invoices.length),
                };
            })
        );

        return analysis.filter(Boolean).sort((a: any, b: any) => b.variance - a.variance);
    }

    /**
     * Get comparison summary (best/worst terms, industry benchmarks)
     */
    static async getSummary(companyId: string) {
        const supplierTerms = await this.analyzePaymentTerms(companyId, 'SUPPLIER');
        const customerTerms = await this.analyzePaymentTerms(companyId, 'CUSTOMER');

        const avgSupplierDays = supplierTerms.length > 0
            ? Math.round(supplierTerms.reduce((sum: number, t: any) => sum + (t.actualAvgDays || t.nominalTermDays), 0) / supplierTerms.length)
            : 0;

        const avgCustomerDays = customerTerms.length > 0
            ? Math.round(customerTerms.reduce((sum: number, t: any) => sum + (t.actualAvgDays || t.nominalTermDays), 0) / customerTerms.length)
            : 0;

        return {
            suppliers: {
                count: supplierTerms.length,
                avgPaymentDays: avgSupplierDays,
                slowPayers: supplierTerms.filter((t: any) => t.varianceLabel === 'SLOW_PAYER').length,
                bestTerms: supplierTerms.slice(-3).reverse(), // fastest payers
                worstTerms: supplierTerms.slice(0, 3), // slowest
            },
            customers: {
                count: customerTerms.length,
                avgPaymentDays: avgCustomerDays,
                slowPayers: customerTerms.filter((t: any) => t.varianceLabel === 'SLOW_PAYER').length,
                bestTerms: customerTerms.slice(-3).reverse(),
                worstTerms: customerTerms.slice(0, 3),
            },
            cashCycleGap: avgCustomerDays - avgSupplierDays, // Positive = customers pay slower
        };
    }

    private static getRecommendation(variance: number, overdueCount: number, totalInvoices: number): string {
        if (overdueCount > totalInvoices * 0.5) return 'HIGH_RISK: >50% invoices overdue. Consider stricter terms or advance payment.';
        if (variance > 15) return 'RENEGOTIATE: Consistently pays 15+ days late. Shorten terms or add penalties.';
        if (variance > 5) return 'MONITOR: Paying slightly late. Send reminders earlier.';
        if (variance < -10) return 'REWARD: Consistently pays early. Offer early payment discounts.';
        return 'HEALTHY: Payment terms are being honored.';
    }
}
