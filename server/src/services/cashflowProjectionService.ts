/**
 * Cashflow Projection Service
 * 
 * P1: Forward-looking cashflow based on pending receivables and payables
 */

import prisma from '../config/prisma';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';

interface CashflowBucket {
    period: string;
    startDate: Date;
    endDate: Date;
    expectedInflows: number;
    expectedOutflows: number;
    netCashflow: number;
    runningBalance: number;
}

interface PendingReceivable {
    id: string;
    type: 'Invoice' | 'PDC';
    number: string;
    partyName: string;
    amount: number;
    dueDate: Date;
    daysOverdue: number;
}

interface PendingPayable {
    id: string;
    type: 'Bill' | 'PDC' | 'Expense';
    number: string;
    partyName: string;
    amount: number;
    dueDate: Date;
    daysOverdue: number;
}

interface CashflowProjection {
    currentBalance: number;
    projection: CashflowBucket[];
    pendingReceivables: PendingReceivable[];
    pendingPayables: PendingPayable[];
    summary: {
        totalReceivables: number;
        totalPayables: number;
        netPosition: number;
        criticalLowDate?: Date;
    };
}

class CashflowProjectionService {
    /**
     * Get current bank balance
     */
    async getCurrentBalance(companyId: string): Promise<number> {
        const accounts = await prisma.bankAccount.findMany({
            where: { companyId },
            select: { balance: true }
        });

        return accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
    }

    /**
     * Get pending receivables (unpaid invoices and PDCs)
     */
    async getPendingReceivables(companyId: string): Promise<PendingReceivable[]> {
        const today = startOfDay(new Date());
        const receivables: PendingReceivable[] = [];

        // Unpaid invoices
        const invoices = await prisma.invoice.findMany({
            where: {
                companyId,
                status: { notIn: ['PAID', 'CANCELLED'] },
                deletedAt: null
            },
            select: {
                id: true,
                invoiceNumber: true,
                totalAmount: true,
                dueDate: true,
                customer: { select: { name: true } }
            }
        });

        for (const inv of invoices) {
            const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date();
            receivables.push({
                id: inv.id,
                type: 'Invoice',
                number: inv.invoiceNumber,
                partyName: inv.customer?.name || 'Unknown',
                amount: Number(inv.totalAmount) || 0,
                dueDate,
                daysOverdue: Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
            });
        }

        // PDCs receivable
        const pdcs = await prisma.postDatedCheque.findMany({
            where: {
                companyId,
                status: 'PENDING',
                type: 'RECEIVABLE'
            },
            select: {
                id: true,
                chequeNumber: true,
                amount: true,
                maturityDate: true,
                party: { select: { name: true } }
            }
        });

        for (const pdc of pdcs) {
            receivables.push({
                id: pdc.id,
                type: 'PDC',
                number: pdc.chequeNumber,
                partyName: pdc.party?.name || 'Unknown',
                amount: Number(pdc.amount) || 0,
                dueDate: pdc.maturityDate,
                daysOverdue: Math.max(0, Math.floor((today.getTime() - pdc.maturityDate.getTime()) / (1000 * 60 * 60 * 24)))
            });
        }

        return receivables.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    }

    /**
     * Get pending payables (unpaid bills, expenses, PDCs)
     */
    async getPendingPayables(companyId: string): Promise<PendingPayable[]> {
        const today = startOfDay(new Date());
        const payables: PendingPayable[] = [];

        // Unpaid bills
        const bills = await prisma.purchaseBill.findMany({
            where: {
                companyId,
                status: { notIn: ['PAID', 'CANCELLED'] },
                deletedAt: null
            },
            select: {
                id: true,
                billNumber: true,
                totalAmount: true,
                dueDate: true,
                supplier: { select: { name: true } }
            }
        });

        for (const bill of bills) {
            const dueDate = bill.dueDate ? new Date(bill.dueDate) : new Date();
            payables.push({
                id: bill.id,
                type: 'Bill',
                number: bill.billNumber,
                partyName: bill.supplier?.name || 'Unknown',
                amount: Number(bill.totalAmount) || 0,
                dueDate,
                daysOverdue: Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
            });
        }

        // PDCs payable
        const pdcs = await prisma.postDatedCheque.findMany({
            where: {
                companyId,
                status: 'PENDING',
                type: 'PAYABLE'
            },
            select: {
                id: true,
                chequeNumber: true,
                amount: true,
                maturityDate: true,
                party: { select: { name: true } }
            }
        });

        for (const pdc of pdcs) {
            payables.push({
                id: pdc.id,
                type: 'PDC',
                number: pdc.chequeNumber,
                partyName: pdc.party?.name || 'Unknown',
                amount: Number(pdc.amount) || 0,
                dueDate: pdc.maturityDate,
                daysOverdue: Math.max(0, Math.floor((today.getTime() - pdc.maturityDate.getTime()) / (1000 * 60 * 60 * 24)))
            });
        }

        return payables.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    }

    /**
     * Generate 30/60/90 day cashflow projection
     */
    async generateProjection(companyId: string, days: number = 90): Promise<CashflowProjection> {
        const today = startOfDay(new Date());
        const currentBalance = await this.getCurrentBalance(companyId);
        const receivables = await this.getPendingReceivables(companyId);
        const payables = await this.getPendingPayables(companyId);

        // Create 30-day buckets
        const buckets: CashflowBucket[] = [];
        let runningBalance = currentBalance;
        const bucketSize = 30; // days
        const numBuckets = Math.ceil(days / bucketSize);

        for (let i = 0; i < numBuckets; i++) {
            const startDate = addDays(today, i * bucketSize);
            const endDate = addDays(today, (i + 1) * bucketSize - 1);

            // Sum receivables in this period
            const periodReceivables = receivables
                .filter(r => r.dueDate >= startDate && r.dueDate <= endDate)
                .reduce((sum, r) => sum + r.amount, 0);

            // Sum payables in this period
            const periodPayables = payables
                .filter(p => p.dueDate >= startDate && p.dueDate <= endDate)
                .reduce((sum, p) => sum + p.amount, 0);

            const netCashflow = periodReceivables - periodPayables;
            runningBalance += netCashflow;

            buckets.push({
                period: i === 0 ? '0-30 days' : `${i * bucketSize + 1}-${(i + 1) * bucketSize} days`,
                startDate,
                endDate,
                expectedInflows: periodReceivables,
                expectedOutflows: periodPayables,
                netCashflow,
                runningBalance
            });
        }

        // Find critical low date (if balance goes negative)
        const criticalBucket = buckets.find(b => b.runningBalance < 0);

        return {
            currentBalance,
            projection: buckets,
            pendingReceivables: receivables,
            pendingPayables: payables,
            summary: {
                totalReceivables: receivables.reduce((sum, r) => sum + r.amount, 0),
                totalPayables: payables.reduce((sum, p) => sum + p.amount, 0),
                netPosition: receivables.reduce((sum, r) => sum + r.amount, 0) - payables.reduce((sum, p) => sum + p.amount, 0),
                criticalLowDate: criticalBucket?.startDate
            }
        };
    }

    /**
     * Get overdue items count
     */
    async getOverdueCount(companyId: string): Promise<{ receivables: number; payables: number }> {
        const receivables = await this.getPendingReceivables(companyId);
        const payables = await this.getPendingPayables(companyId);

        return {
            receivables: receivables.filter(r => r.daysOverdue > 0).length,
            payables: payables.filter(p => p.daysOverdue > 0).length
        };
    }
}

export default new CashflowProjectionService();
