"use strict";
/**
 * Financial Reports Controller
 *
 * Handles Profit & Loss and Balance Sheet reports.
 * Split from reportsController.ts for better maintainability.
 *
 * FIX: Now uses accountingService for ledger-based accuracy.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertCurrency = exports.getExchangeRates = exports.getBudgetAlerts = exports.saveBudget = exports.getBudgetVsActual = exports.getCashFlowForecast = exports.getProfitLossTrends = exports.getDashboardSummary = exports.getBalanceSheet = exports.getProfitLoss = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const accountingService = __importStar(require("../../services/accountingService"));
const logger_1 = __importDefault(require("../../config/logger"));
// Profit & Loss Statement (Ledger-based)
const getProfitLoss = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const companyId = req.user.companyId;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();
        // FIX: Use accountingService for accurate ledger-based P&L
        const plData = await accountingService.getProfitAndLoss(companyId, start, end);
        // Calculate derived values
        const totalIncome = plData.totals.totalIncome;
        const totalExpense = plData.totals.totalExpense;
        const netProfit = plData.totals.netProfit;
        // Group income by ledger group
        const incomeBreakdown = {};
        plData.income.forEach((item) => {
            const group = item.groupName || 'Other Income';
            incomeBreakdown[group] = (incomeBreakdown[group] || 0) + item.amount;
        });
        // Group expenses by ledger group
        const expenseBreakdown = {};
        plData.expense.forEach((item) => {
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
    }
    catch (error) {
        logger_1.default.error('Get P&L error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating P&L statement'
        });
    }
};
exports.getProfitLoss = getProfitLoss;
// Balance Sheet (Ledger-based)
const getBalanceSheet = async (req, res) => {
    try {
        const { asOfDate } = req.query;
        const companyId = req.user.companyId;
        const date = asOfDate ? new Date(asOfDate) : new Date();
        // FIX: Use accountingService for accurate ledger-based Balance Sheet
        const bsData = await accountingService.getBalanceSheet(companyId, date);
        // Group assets by ledger group
        const assetBreakdown = {};
        bsData.assets.forEach((item) => {
            const group = item.groupName || 'Other Assets';
            if (!assetBreakdown[group]) {
                assetBreakdown[group] = { items: [], total: 0 };
            }
            assetBreakdown[group].items.push(item);
            assetBreakdown[group].total += item.amount;
        });
        // Group liabilities by ledger group
        const liabilityBreakdown = {};
        bsData.liabilities.forEach((item) => {
            const group = item.groupName || 'Other Liabilities';
            if (!liabilityBreakdown[group]) {
                liabilityBreakdown[group] = { items: [], total: 0 };
            }
            liabilityBreakdown[group].items.push(item);
            liabilityBreakdown[group].total += item.amount;
        });
        // Group equity by ledger group
        const equityBreakdown = {};
        bsData.equity.forEach((item) => {
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
    }
    catch (error) {
        logger_1.default.error('Get Balance Sheet error:', error);
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
        logger_1.default.error('Get Dashboard Summary error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating dashboard summary'
        });
    }
};
exports.getDashboardSummary = getDashboardSummary;
// Profit & Loss Trends (Last 6 months)
const getProfitLossTrends = async (req, res) => {
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
            const invoices = await prisma_1.default.invoice.findMany({
                where: {
                    companyId,
                    invoiceDate: { gte: startOfMonth, lte: endOfMonth },
                    status: { not: 'CANCELLED' }
                },
                select: { totalAmount: true }
            });
            const revenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
            // Cost of Goods Sold (Purchases)
            const purchases = await prisma_1.default.purchaseOrder.findMany({
                where: {
                    companyId,
                    orderDate: { gte: startOfMonth, lte: endOfMonth }
                },
                select: { totalAmount: true }
            });
            const cogs = purchases.reduce((sum, po) => sum + Number(po.totalAmount), 0);
            // Expenses
            const expenses = await prisma_1.default.expense.findMany({
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
    }
    catch (error) {
        logger_1.default.error('Get P&L Trends error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting P&L trends'
        });
    }
};
exports.getProfitLossTrends = getProfitLossTrends;
// Cash Flow Forecast (Basic)
const getCashFlowForecast = async (req, res) => {
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
            const receivables = await prisma_1.default.invoice.aggregate({
                where: {
                    companyId,
                    dueDate: { gte: startOfMonth, lte: endOfMonth },
                    status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] }
                },
                _sum: { balanceAmount: true }
            });
            // Outflow: Payables (Unpaid Purchase Orders/Bills due this month)
            const payables = await prisma_1.default.purchaseOrder.aggregate({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCashFlowForecast = getCashFlowForecast;
// Budget vs Actual
const getBudgetVsActual = async (req, res) => {
    try {
        const budgetService = (await Promise.resolve().then(() => __importStar(require('../../services/budgetService')))).default;
        const companyId = req.user.companyId;
        const period = req.query.period || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const data = await budgetService.getBudgetVsActual(companyId, period);
        res.json({ success: true, data });
    }
    catch (error) {
        logger_1.default.error('Budget vs Actual error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getBudgetVsActual = getBudgetVsActual;
const saveBudget = async (req, res) => {
    try {
        const budgetService = (await Promise.resolve().then(() => __importStar(require('../../services/budgetService')))).default;
        const companyId = req.user.companyId;
        const { period, lines } = req.body;
        const result = await budgetService.saveBudget(companyId, period, lines);
        res.json({ success: true, data: result });
    }
    catch (error) {
        logger_1.default.error('Save budget error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.saveBudget = saveBudget;
const getBudgetAlerts = async (req, res) => {
    try {
        const budgetService = (await Promise.resolve().then(() => __importStar(require('../../services/budgetService')))).default;
        const companyId = req.user.companyId;
        const period = req.query.period || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const alerts = await budgetService.getBudgetAlerts(companyId, period);
        res.json({ success: true, data: alerts });
    }
    catch (error) {
        logger_1.default.error('Budget alerts error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getBudgetAlerts = getBudgetAlerts;
// Exchange Rates
const getExchangeRates = async (req, res) => {
    try {
        const currencyService = (await Promise.resolve().then(() => __importStar(require('../../services/multiCurrencyService')))).default;
        const baseCurrency = req.query.base || 'INR';
        const rates = await currencyService.getExchangeRates(baseCurrency);
        res.json({ success: true, data: rates });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getExchangeRates = getExchangeRates;
const convertCurrency = async (req, res) => {
    try {
        const currencyService = (await Promise.resolve().then(() => __importStar(require('../../services/multiCurrencyService')))).default;
        const { amount, fromCurrency, toCurrency } = req.body;
        const result = await currencyService.convertCurrency(amount, fromCurrency, toCurrency);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.convertCurrency = convertCurrency;
//# sourceMappingURL=financialReportsController.js.map