"use strict";
/**
 * Financial Reports Controller
 *
 * Handles Profit & Loss and Balance Sheet reports.
 * Split from reportsController.ts for better maintainability.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = exports.getBalanceSheet = exports.getProfitLoss = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
// Profit & Loss Statement
const getProfitLoss = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // @ts-ignore
        const companyId = req.user.companyId;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();
        // Revenue (Sales)
        const invoices = await prisma_1.default.invoice.findMany({
            where: {
                companyId,
                invoiceDate: { gte: start, lte: end },
                status: { not: 'CANCELLED' }
            }
        });
        const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const totalTax = invoices.reduce((sum, inv) => sum + Number(inv.totalTax), 0);
        // Cost of Goods Sold (Purchases)
        const purchases = await prisma_1.default.purchaseOrder.findMany({
            where: {
                companyId,
                orderDate: { gte: start, lte: end }
            }
        });
        const totalPurchases = purchases.reduce((sum, po) => sum + Number(po.totalAmount), 0);
        // Expenses
        const expenses = await prisma_1.default.expense.findMany({
            where: {
                companyId,
                date: { gte: start, lte: end }
            }
        });
        const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        // Calculate P&L
        const grossProfit = totalRevenue - totalPurchases;
        const operatingExpenses = totalExpenses;
        const operatingProfit = grossProfit - operatingExpenses;
        const netProfit = operatingProfit;
        res.json({
            success: true,
            data: {
                period: { startDate: start, endDate: end },
                revenue: {
                    totalSales: totalRevenue,
                    taxCollected: totalTax,
                    netRevenue: totalRevenue - totalTax
                },
                costOfGoodsSold: totalPurchases,
                grossProfit,
                operatingExpenses: {
                    total: operatingExpenses,
                    breakdown: expenses.reduce((acc, exp) => {
                        const category = exp.category || 'Other';
                        acc[category] = (acc[category] || 0) + Number(exp.amount);
                        return acc;
                    }, {})
                },
                operatingProfit,
                netProfit,
                profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
            }
        });
    }
    catch (error) {
        console.error('Get P&L error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating P&L statement'
        });
    }
};
exports.getProfitLoss = getProfitLoss;
// Balance Sheet
const getBalanceSheet = async (req, res) => {
    try {
        const { asOfDate } = req.query;
        // @ts-ignore
        const companyId = req.user.companyId;
        const date = asOfDate ? new Date(asOfDate) : new Date();
        // Assets
        const invoices = await prisma_1.default.invoice.findMany({
            where: { companyId, invoiceDate: { lte: date }, status: { not: 'CANCELLED' } }
        });
        const accountsReceivable = invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);
        // Inventory valuation
        const products = await prisma_1.default.product.findMany({
            where: { companyId, isActive: true }
        });
        const inventoryValue = products.reduce((sum, p) => sum + (p.currentStock * Number(p.purchasePrice)), 0);
        // Liabilities
        const purchases = await prisma_1.default.purchaseOrder.findMany({
            where: { companyId, orderDate: { lte: date } }
        });
        const accountsPayable = purchases.reduce((sum, po) => sum + (Number(po.totalAmount) - Number(po.paidAmount)), 0);
        // Equity
        const parties = await prisma_1.default.party.findMany({
            where: { companyId }
        });
        const openingBalances = parties.reduce((sum, p) => sum + Number(p.openingBalance), 0);
        const totalAssets = accountsReceivable + inventoryValue;
        const totalLiabilities = accountsPayable;
        const equity = totalAssets - totalLiabilities;
        res.json({
            success: true,
            data: {
                asOf: date,
                assets: {
                    currentAssets: {
                        accountsReceivable,
                        inventory: inventoryValue,
                        total: accountsReceivable + inventoryValue
                    },
                    totalAssets
                },
                liabilities: {
                    currentLiabilities: {
                        accountsPayable,
                        total: accountsPayable
                    },
                    totalLiabilities
                },
                equity: {
                    retainedEarnings: equity,
                    total: equity
                },
                verification: totalAssets === (totalLiabilities + equity)
            }
        });
    }
    catch (error) {
        console.error('Get Balance Sheet error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating balance sheet'
        });
    }
};
exports.getBalanceSheet = getBalanceSheet;
// Dashboard Summary for Reports Overview
const getDashboardSummary = async (req, res) => {
    try {
        // @ts-ignore
        const companyId = req.user.companyId;
        // Get current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        // Last month for comparison
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        // Current month sales
        const currentMonthInvoices = await prisma_1.default.invoice.findMany({
            where: {
                companyId,
                invoiceDate: { gte: startOfMonth, lte: endOfMonth },
                status: { not: 'CANCELLED' }
            }
        });
        const totalSales = currentMonthInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        // Last month sales for comparison
        const lastMonthInvoices = await prisma_1.default.invoice.findMany({
            where: {
                companyId,
                invoiceDate: { gte: startOfLastMonth, lte: endOfLastMonth },
                status: { not: 'CANCELLED' }
            }
        });
        const lastMonthSales = lastMonthInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const salesTrend = lastMonthSales > 0 ? ((totalSales - lastMonthSales) / lastMonthSales) * 100 : 0;
        // Current month purchases
        const currentMonthPurchases = await prisma_1.default.purchaseOrder.findMany({
            where: {
                companyId,
                orderDate: { gte: startOfMonth, lte: endOfMonth }
            }
        });
        const totalPurchases = currentMonthPurchases.reduce((sum, po) => sum + Number(po.totalAmount), 0);
        // Last month purchases for comparison
        const lastMonthPurchases = await prisma_1.default.purchaseOrder.findMany({
            where: {
                companyId,
                orderDate: { gte: startOfLastMonth, lte: endOfLastMonth }
            }
        });
        const lastMonthPurchasesTotal = lastMonthPurchases.reduce((sum, po) => sum + Number(po.totalAmount), 0);
        const purchaseTrend = lastMonthPurchasesTotal > 0 ? ((totalPurchases - lastMonthPurchasesTotal) / lastMonthPurchasesTotal) * 100 : 0;
        // Expenses
        const currentMonthExpenses = await prisma_1.default.expense.findMany({
            where: {
                companyId,
                date: { gte: startOfMonth, lte: endOfMonth }
            }
        });
        const totalExpenses = currentMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        // Net Profit
        const netProfit = totalSales - totalPurchases - totalExpenses;
        const lastMonthExpenses = await prisma_1.default.expense.findMany({
            where: {
                companyId,
                date: { gte: startOfLastMonth, lte: endOfLastMonth }
            }
        });
        const lastMonthExpensesTotal = lastMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        const lastMonthProfit = lastMonthSales - lastMonthPurchasesTotal - lastMonthExpensesTotal;
        const profitTrend = lastMonthProfit !== 0 ? ((netProfit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100 : 0;
        // Inventory Value
        const products = await prisma_1.default.product.findMany({
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
    }
    catch (error) {
        console.error('Get Dashboard Summary error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating dashboard summary'
        });
    }
};
exports.getDashboardSummary = getDashboardSummary;
//# sourceMappingURL=financialReportsController.js.map