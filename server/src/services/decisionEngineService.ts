/**
 * Decision Engine Service
 * 
 * Phase 5: Actionable insights for MSME owners
 */

import prisma from '../config/prisma';
import valuationService from './valuationService';
import cashflowProjectionService from './cashflowProjectionService';
import { startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth } from 'date-fns';

export interface ProfitHeatmapItem {
    id: string;
    name: string;
    category?: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
    marginPercentage: number;
}

export interface CashLeakageAlert {
    type: 'RECEIVABLE' | 'INVENTORY' | 'PDC' | 'TAX';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    amount: number;
    actionLink?: string;
}

export interface DecisionInsights {
    profitHeatmap: ProfitHeatmapItem[];
    leakageAlerts: CashLeakageAlert[];
    weeklySummary: {
        revenue: number;
        revenueGrowth: number;
        topFocusAreas: string[];
    };
}

class DecisionEngineService {
    /**
     * Get Profit Heatmap data (Product-wise)
     */
    async getProfitHeatmap(companyId: string, startDate?: Date, endDate?: Date): Promise<ProfitHeatmapItem[]> {
        const start = startDate || startOfMonth(new Date());
        const end = endDate || endOfMonth(new Date());

        // 1. Get all invoice items in period
        const invoiceItems = await prisma.invoiceItem.findMany({
            where: {
                invoice: {
                    companyId,
                    invoiceDate: { gte: start, lte: end },
                    status: { not: 'CANCELLED' }
                }
            }
        });

        // 2. Aggregate data by product
        const productMap = new Map<string, { revenue: number, quantity: number, name: string, category?: string }>();

        for (const item of invoiceItems) {
            if (!item.productId) continue;

            const current = productMap.get(item.productId) || {
                revenue: 0,
                quantity: 0,
                name: item.productName || 'Unknown Product',
                category: 'Uncategorized'
            };
            current.revenue += Number(item.total);
            current.quantity += Number(item.quantity);
            productMap.set(item.productId, current);
        }

        // 3. Calculate COGS and Margins using valuation service
        const items: ProfitHeatmapItem[] = [];
        for (const [productId, data] of productMap.entries()) {
            const valuation = await valuationService.getInventoryValuation(productId, companyId);
            const cogs = data.quantity * valuation.unitCost;
            const grossProfit = data.revenue - cogs;
            const marginPercentage = data.revenue > 0 ? (grossProfit / data.revenue) * 100 : 0;

            items.push({
                id: productId,
                name: data.name,
                category: data.category,
                revenue: Math.round(data.revenue * 100) / 100,
                cogs: Math.round(cogs * 100) / 100,
                grossProfit: Math.round(grossProfit * 100) / 100,
                marginPercentage: Math.round(marginPercentage * 100) / 100
            });
        }

        return items.sort((a, b) => b.revenue - a.revenue);
    }

    /**
     * Identify Cash Leakage Alerts
     */
    async getCashLeakageAlerts(companyId: string): Promise<CashLeakageAlert[]> {
        const alerts: CashLeakageAlert[] = [];
        const today = new Date();

        // 1. Risky Receivables (Overdue > 45 days)
        const overdue45 = await prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: {
                companyId,
                status: { notIn: ['PAID', 'CANCELLED'] },
                dueDate: { lte: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000) },
                deletedAt: null
            }
        });

        const overdueAmount = Number(overdue45._sum.totalAmount || 0);
        if (overdueAmount > 0) {
            alerts.push({
                type: 'RECEIVABLE',
                severity: overdueAmount > 500000 ? 'CRITICAL' : 'HIGH',
                title: 'Stagnant Receivables',
                description: `${(overdueAmount / 100000).toFixed(1)}L is pending for over 45 days. Follow up with debtors immediately.`,
                amount: overdueAmount,
                actionLink: '/dashboard/reports/aging'
            });
        }

        // 2. Slow Moving Inventory (Not sold in 60 days)
        // Optimization: Just check products with no stock movement in 60 days
        const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
        const slowProducts = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true,
                stockMovements: {
                    none: {
                        createdAt: { gte: sixtyDaysAgo },
                        type: 'SALE'
                    }
                },
                currentStock: { gt: 0 }
            }
        });

        let deadStockValue = 0;
        for (const p of slowProducts) {
            const val = await valuationService.getInventoryValuation(p.id, companyId);
            deadStockValue += val.totalValue;
        }

        if (deadStockValue > 0) {
            alerts.push({
                type: 'INVENTORY',
                severity: 'MEDIUM',
                title: 'Dead Inventory',
                description: `${slowProducts.length} items have no sales in 60 days. Consider clearance sales to free up cash.`,
                amount: deadStockValue,
                actionLink: '/dashboard/inventory'
            });
        }

        // 3. PDC Bouncing Risks (Manual check for upcoming PDCs vs Bank Balance)
        const projection = await cashflowProjectionService.generateProjection(companyId, 7);
        if (projection.summary.criticalLowDate) {
            alerts.push({
                type: 'PDC',
                severity: 'CRITICAL',
                title: 'Negative Cashflow Warning',
                description: `Projected bank balance becomes negative around ${projection.summary.criticalLowDate.toLocaleDateString()}. Check upcoming PDCs.`,
                amount: Math.abs(projection.summary.netPosition),
                actionLink: '/dashboard/banking'
            });
        }

        return alerts;
    }

    /**
     * Get Weekly Summary and Focus Areas
     */
    async getWeeklySummary(companyId: string) {
        const start = startOfWeek(new Date());
        const end = endOfWeek(new Date());
        const lastWeekStart = startOfWeek(subWeeks(new Date(), 1));
        const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1));

        const thisWeekSales = await prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: { companyId, invoiceDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } }
        });

        const lastWeekSales = await prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: { companyId, invoiceDate: { gte: lastWeekStart, lte: lastWeekEnd }, status: { not: 'CANCELLED' } }
        });

        const thisWeekVal = Number(thisWeekSales._sum.totalAmount || 0);
        const lastWeekVal = Number(lastWeekSales._sum.totalAmount || 0);
        const growth = lastWeekVal > 0 ? ((thisWeekVal - lastWeekVal) / lastWeekVal) * 100 : 0;

        // Dynamic Focus Areas
        const focusAreas = [];
        const alerts = await this.getCashLeakageAlerts(companyId);

        if (alerts.find(a => a.type === 'RECEIVABLE')) focusAreas.push('Aggressive Collection');
        if (alerts.find(a => a.type === 'INVENTORY')) focusAreas.push('Inventory Clearance');
        if (thisWeekVal < lastWeekVal) focusAreas.push('Sales Recovery');
        if (focusAreas.length === 0) focusAreas.push('Expansion Planning', 'Cost Optimization');

        return {
            revenue: thisWeekVal,
            revenueGrowth: Math.round(growth * 100) / 100,
            topFocusAreas: focusAreas.slice(0, 3)
        };
    }
}

export default new DecisionEngineService();
