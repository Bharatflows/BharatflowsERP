/**
 * Financial Reports Controller
 * 
 * Handles Profit & Loss and Balance Sheet reports.
 * Split from reportsController.ts for better maintainability.
 * 
 * FIX: Now uses accountingService for ledger-based accuracy.
 */

import { Response } from 'express';
import prisma from '../../config/prisma';
import * as accountingService from '../../services/accountingService';
import logger from '../../config/logger';
import { ProtectedRequest } from '../../middleware/auth';

// Profit & Loss Statement (Ledger-based)
export const getProfitLoss = async (req: ProtectedRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const companyId = req.user.companyId;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate as string) : new Date();

        // FIX: Use accountingService for accurate ledger-based P&L
        const plData = await accountingService.getProfitAndLoss(companyId, start, end);

        // Calculate derived values
        const totalIncome = plData.totals.totalIncome;
        const totalExpense = plData.totals.totalExpense;
        const netProfit = plData.totals.netProfit;

        // Group income by ledger group
        const incomeBreakdown: Record<string, number> = {};
        plData.income.forEach((item: any) => {
            const group = item.groupName || 'Other Income';
            incomeBreakdown[group] = (incomeBreakdown[group] || 0) + item.amount;
        });

        // Group expenses by ledger group
        const expenseBreakdown: Record<string, number> = {};
        plData.expense.forEach((item: any) => {
            const group = item.groupName || 'Other Expenses';
            expenseBreakdown[group] = (expenseBreakdown[group] || 0) + item.amount;
        });

        res.json({
            success: true,
            data: {
                period: { startDate: start, endDate: end },
                revenue: {
                    totalSales: totalIncome,
                    breakdown: incomeBreakdown
                },
                costOfGoodsSold: expenseBreakdown['Direct Expenses'] || 0,
                grossProfit: totalIncome - (expenseBreakdown['Direct Expenses'] || 0),
                operatingExpenses: {
                    total: totalExpense - (expenseBreakdown['Direct Expenses'] || 0),
                    breakdown: expenseBreakdown
                },
                operatingProfit: netProfit,
                netProfit,
                profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
                // Include raw ledger details for drill-down
                incomeDetails: plData.income,
                expenseDetails: plData.expense
            }
        });
    } catch (error: any) {
        logger.error('Get P&L error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating P&L statement'
        });
    }
};


// Balance Sheet (Ledger-based)
export const getBalanceSheet = async (req: ProtectedRequest, res: Response) => {
    try {
        const { asOfDate } = req.query;
        const companyId = req.user.companyId;

        const date = asOfDate ? new Date(asOfDate as string) : new Date();

        // FIX: Use accountingService for accurate ledger-based Balance Sheet
        const bsData = await accountingService.getBalanceSheet(companyId, date);

        // Group assets by ledger group
        const assetBreakdown: Record<string, { items: any[]; total: number }> = {};
        bsData.assets.forEach((item: any) => {
            const group = item.groupName || 'Other Assets';
            if (!assetBreakdown[group]) {
                assetBreakdown[group] = { items: [], total: 0 };
            }
            assetBreakdown[group].items.push(item);
            assetBreakdown[group].total += item.amount;
        });

        // Group liabilities by ledger group
        const liabilityBreakdown: Record<string, { items: any[]; total: number }> = {};
        bsData.liabilities.forEach((item: any) => {
            const group = item.groupName || 'Other Liabilities';
            if (!liabilityBreakdown[group]) {
                liabilityBreakdown[group] = { items: [], total: 0 };
            }
            liabilityBreakdown[group].items.push(item);
            liabilityBreakdown[group].total += item.amount;
        });

        // Group equity by ledger group
        const equityBreakdown: Record<string, { items: any[]; total: number }> = {};
        bsData.equity.forEach((item: any) => {
            const group = item.groupName || 'Capital';
            if (!equityBreakdown[group]) {
                equityBreakdown[group] = { items: [], total: 0 };
            }
            equityBreakdown[group].items.push(item);
            equityBreakdown[group].total += item.amount;
        });

        res.json({
            success: true,
            data: {
                asOf: date,
                assets: {
                    breakdown: assetBreakdown,
                    totalAssets: bsData.totals.totalAssets
                },
                liabilities: {
                    breakdown: liabilityBreakdown,
                    totalLiabilities: bsData.totals.totalLiabilities
                },
                equity: {
                    breakdown: equityBreakdown,
                    totalEquity: bsData.totals.totalEquity
                },
                verification: bsData.totals.totalAssets === bsData.totals.totalLiabilitiesAndEquity,
                // Include raw ledger details for drill-down
                assetDetails: bsData.assets,
                liabilityDetails: bsData.liabilities,
                equityDetails: bsData.equity
            }
        });
    } catch (error: any) {
        logger.error('Get Balance Sheet error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating balance sheet'
        });
    }
};


// Dashboard Summary for Reports Overview
export const getDashboardSummary = async (req: ProtectedRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;

        // Get current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Last month for comparison
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Current month sales
        const currentMonthInvoices = await prisma.invoice.findMany({
            where: {
                companyId,
                invoiceDate: { gte: startOfMonth, lte: endOfMonth },
                status: { not: 'CANCELLED' }
            }
        });
        const totalSales = currentMonthInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

        // Last month sales for comparison
        const lastMonthInvoices = await prisma.invoice.findMany({
            where: {
                companyId,
                invoiceDate: { gte: startOfLastMonth, lte: endOfLastMonth },
                status: { not: 'CANCELLED' }
            }
        });
        const lastMonthSales = lastMonthInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const salesTrend = lastMonthSales > 0 ? ((totalSales - lastMonthSales) / lastMonthSales) * 100 : 0;

        // Current month purchases
        const currentMonthPurchases = await prisma.purchaseOrder.findMany({
            where: {
                companyId,
                orderDate: { gte: startOfMonth, lte: endOfMonth }
            }
        });
        const totalPurchases = currentMonthPurchases.reduce((sum, po) => sum + Number(po.totalAmount), 0);

        // Last month purchases for comparison
        const lastMonthPurchases = await prisma.purchaseOrder.findMany({
            where: {
                companyId,
                orderDate: { gte: startOfLastMonth, lte: endOfLastMonth }
            }
        });
        const lastMonthPurchasesTotal = lastMonthPurchases.reduce((sum, po) => sum + Number(po.totalAmount), 0);
        const purchaseTrend = lastMonthPurchasesTotal > 0 ? ((totalPurchases - lastMonthPurchasesTotal) / lastMonthPurchasesTotal) * 100 : 0;

        // Expenses
        const currentMonthExpenses = await prisma.expense.findMany({
            where: {
                companyId,
                date: { gte: startOfMonth, lte: endOfMonth }
            }
        });
        const totalExpenses = currentMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

        // Net Profit
        const netProfit = totalSales - totalPurchases - totalExpenses;
        const lastMonthExpenses = await prisma.expense.findMany({
            where: {
                companyId,
                date: { gte: startOfLastMonth, lte: endOfLastMonth }
            }
        });
        const lastMonthExpensesTotal = lastMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        const lastMonthProfit = lastMonthSales - lastMonthPurchasesTotal - lastMonthExpensesTotal;
        const profitTrend = lastMonthProfit !== 0 ? ((netProfit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100 : 0;

        // Inventory Value
        const products = await prisma.product.findMany({
            where: { companyId, isActive: true }
        });
        const inventoryValue = products.reduce((sum, p) => sum + (p.currentStock * Number(p.purchasePrice)), 0);

        res.json({
            success: true,
            data: {
                period: {
                    month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    startDate: startOfMonth,
                    endDate: endOfMonth
                },
                kpis: {
                    totalSales,
                    salesTrend: Math.round(salesTrend),
                    totalPurchases,
                    purchaseTrend: Math.round(purchaseTrend),
                    netProfit,
                    profitTrend: Math.round(profitTrend),
                    inventoryValue
                }
            }
        });
    } catch (error: any) {
        logger.error('Get Dashboard Summary error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating dashboard summary'
        });
    }
};

// Profit & Loss Trends (Last 6 months)
export const getProfitLossTrends = async (req: ProtectedRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const monthsToFetch = 6;
        const trends = [];

        for (let i = 0; i < monthsToFetch; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();

            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0, 23, 59, 59);

            // Revenue
            const invoices = await prisma.invoice.findMany({
                where: {
                    companyId,
                    invoiceDate: { gte: startOfMonth, lte: endOfMonth },
                    status: { not: 'CANCELLED' }
                },
                select: { totalAmount: true }
            });
            const revenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

            // Cost of Goods Sold (Purchases)
            const purchases = await prisma.purchaseOrder.findMany({
                where: {
                    companyId,
                    orderDate: { gte: startOfMonth, lte: endOfMonth }
                },
                select: { totalAmount: true }
            });
            const cogs = purchases.reduce((sum, po) => sum + Number(po.totalAmount), 0);

            // Expenses
            const expenses = await prisma.expense.findMany({
                where: {
                    companyId,
                    date: { gte: startOfMonth, lte: endOfMonth }
                },
                select: { amount: true }
            });
            const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

            const netProfit = revenue - cogs - totalExpenses;

            trends.unshift({
                month: date.toLocaleString('default', { month: 'short' }),
                year,
                revenue,
                expenses: cogs + totalExpenses,
                profit: netProfit
            });
        }

        res.json({
            success: true,
            data: trends
        });
    } catch (error: any) {
        logger.error('Get P&L Trends error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting P&L trends'
        });
    }
};
// Cash Flow Forecast (Basic)
export const getCashFlowForecast = async (req: ProtectedRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const months = 6;
        const forecast = [];

        for (let i = 0; i < months; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() + i);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            // Inflow: Receivables (Unpaid Invoices due this month)
            const receivables = await prisma.invoice.aggregate({
                where: {
                    companyId,
                    dueDate: { gte: startOfMonth, lte: endOfMonth },
                    status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] }
                },
                _sum: { balanceAmount: true }
            });

            // Outflow: Payables (Unpaid Purchase Orders/Bills due this month)
            const payables = await prisma.purchaseOrder.aggregate({
                where: {
                    companyId,
                    expectedDate: { gte: startOfMonth, lte: endOfMonth },
                    status: { in: ['SENT', 'PARTIAL'] }
                },
                _sum: { totalAmount: true }
            });

            forecast.push({
                month: date.toLocaleString('default', { month: 'short' }),
                year: date.getFullYear(),
                inflow: Number(receivables._sum?.balanceAmount || 0),
                outflow: Number(payables._sum?.totalAmount || 0),
                net: Number(receivables._sum?.balanceAmount || 0) - Number(payables._sum?.totalAmount || 0)
            });
        }

        res.json({ success: true, data: forecast });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Budget vs Actual
export const getBudgetVsActual = async (req: ProtectedRequest, res: Response) => {
    try {
        const budgetService = (await import('../../services/budgetService')).default;
        const companyId = req.user.companyId;
        const period = req.query.period as string || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const data = await budgetService.getBudgetVsActual(companyId, period);
        res.json({ success: true, data });
    } catch (error: any) {
        logger.error('Budget vs Actual error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const saveBudget = async (req: ProtectedRequest, res: Response) => {
    try {
        const budgetService = (await import('../../services/budgetService')).default;
        const companyId = req.user.companyId;
        const { period, lines } = req.body;
        const result = await budgetService.saveBudget(companyId, period, lines);
        res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Save budget error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBudgetAlerts = async (req: ProtectedRequest, res: Response) => {
    try {
        const budgetService = (await import('../../services/budgetService')).default;
        const companyId = req.user.companyId;
        const period = req.query.period as string || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const alerts = await budgetService.getBudgetAlerts(companyId, period);
        res.json({ success: true, data: alerts });
    } catch (error: any) {
        logger.error('Budget alerts error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Exchange Rates
export const getExchangeRates = async (req: ProtectedRequest, res: Response) => {
    try {
        const currencyService = (await import('../../services/multiCurrencyService')).default;
        const baseCurrency = req.query.base as string || 'INR';
        const rates = await currencyService.getExchangeRates(baseCurrency);
        res.json({ success: true, data: rates });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const convertCurrency = async (req: ProtectedRequest, res: Response) => {
    try {
        const currencyService = (await import('../../services/multiCurrencyService')).default;
        const { amount, fromCurrency, toCurrency } = req.body;
        const result = await currencyService.convertCurrency(amount, fromCurrency, toCurrency);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

