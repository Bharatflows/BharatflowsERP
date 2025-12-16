"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalesChart = exports.getRecentTransactions = exports.getDashboardStats = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const date_fns_1 = require("date-fns");
const getDashboardStats = async (req, res) => {
    try {
        // @ts-ignore
        const companyId = req.user.companyId;
        const today = new Date();
        const startOfCurrentMonth = (0, date_fns_1.startOfMonth)(today);
        const startOfLastMonth = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(today, 1));
        const endOfLastMonth = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(today, 1));
        // 1. KPIs
        // Revenue (Total Paid Invoices)
        const currentMonthRevenue = await prisma_1.default.invoice.aggregate({
            where: {
                companyId,
                status: 'PAID',
                updatedAt: { gte: startOfCurrentMonth }
            },
            _sum: { totalAmount: true }
        });
        const lastMonthRevenue = await prisma_1.default.invoice.aggregate({
            where: {
                companyId,
                status: 'PAID',
                updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth }
            },
            _sum: { totalAmount: true }
        });
        // Sales (Total Invoices Generated)
        const currentMonthSales = await prisma_1.default.invoice.aggregate({
            where: {
                companyId,
                createdAt: { gte: startOfCurrentMonth }
            },
            _sum: { totalAmount: true }
        });
        // Purchases
        const currentMonthPurchases = await prisma_1.default.purchaseOrder.aggregate({
            where: {
                companyId,
                createdAt: { gte: startOfCurrentMonth }
            },
            _sum: { totalAmount: true }
        });
        // Active Parties
        const activePartiesCount = await prisma_1.default.party.count({
            where: { companyId, isActive: true }
        });
        // 2. Top Selling Products
        const topProducts = await prisma_1.default.invoiceItem.groupBy({
            by: ['productId', 'productName'],
            where: {
                invoice: { companyId }
            },
            _sum: {
                quantity: true,
                total: true
            },
            orderBy: {
                _sum: { total: 'desc' }
            },
            take: 5
        });
        // 3. Low Stock Alerts (products where currentStock <= minStock)
        const lowStockProducts = await prisma_1.default.product.findMany({
            where: {
                companyId,
                isActive: true
            }
        });
        // Filter products where currentStock <= minStock in JS (Prisma limitation for column comparison)
        const filteredLowStock = lowStockProducts
            .filter(p => (p.currentStock || 0) <= (p.minStock || 0))
            .slice(0, 5);
        // 4. Pending Tasks
        const overdueInvoices = await prisma_1.default.invoice.count({
            where: {
                companyId,
                status: 'SENT',
                dueDate: { lt: today }
            }
        });
        const pendingPO = await prisma_1.default.purchaseOrder.count({
            where: {
                companyId,
                status: 'DRAFT'
            }
        });
        res.json({
            success: true,
            data: {
                kpis: {
                    revenue: currentMonthRevenue._sum.totalAmount || 0,
                    revenueChange: 0, // Calculate percentage change if needed
                    sales: currentMonthSales._sum.totalAmount || 0,
                    purchases: currentMonthPurchases._sum.totalAmount || 0,
                    activeParties: activePartiesCount
                },
                topProducts: topProducts.map(p => ({
                    name: p.productName,
                    sales: p._sum.quantity || 0,
                    amount: p._sum.total || 0
                })),
                lowStock: filteredLowStock.map(p => ({
                    name: p.name,
                    current: p.currentStock,
                    minimum: p.minStock,
                    unit: p.unit
                })),
                pendingTasks: [
                    { task: "Overdue Invoices", count: overdueInvoices },
                    { task: "Low Stock Items", count: filteredLowStock.length },
                    { task: "Pending Purchase Orders", count: pendingPO }
                ].filter(t => t.count > 0)
            }
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching dashboard stats'
        });
    }
};
exports.getDashboardStats = getDashboardStats;
const getRecentTransactions = async (req, res) => {
    try {
        // @ts-ignore
        const companyId = req.user.companyId;
        // Fetch recent invoices (Sales)
        const recentInvoices = await prisma_1.default.invoice.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { customer: true }
        });
        // Fetch recent purchase orders (Purchases)
        const recentPurchases = await prisma_1.default.purchaseOrder.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { supplier: true }
        });
        // Combine and sort
        const transactions = [
            ...recentInvoices.map(inv => ({
                id: inv.id,
                type: 'sale',
                invoiceNumber: inv.invoiceNumber,
                partyName: inv.customer?.name || 'Unknown',
                amount: inv.totalAmount,
                date: inv.createdAt,
                status: inv.status.toLowerCase()
            })),
            ...recentPurchases.map(po => ({
                id: po.id,
                type: 'purchase',
                invoiceNumber: po.orderNumber,
                partyName: po.supplier?.name || 'Unknown',
                amount: po.totalAmount,
                date: po.createdAt,
                status: po.status.toLowerCase()
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
        res.json({
            success: true,
            data: transactions
        });
    }
    catch (error) {
        console.error('Recent transactions error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching recent transactions'
        });
    }
};
exports.getRecentTransactions = getRecentTransactions;
const getSalesChart = async (req, res) => {
    try {
        // @ts-ignore
        const companyId = req.user.companyId;
        const { period } = req.query; // 7d, 30d, 90d
        let startDate = new Date();
        if (period === '30d') {
            startDate.setDate(startDate.getDate() - 30);
        }
        else if (period === '90d') {
            startDate.setDate(startDate.getDate() - 90);
        }
        else {
            startDate.setDate(startDate.getDate() - 7);
        }
        // Fetch sales (invoices)
        const invoices = await prisma_1.default.invoice.groupBy({
            by: ['createdAt'],
            where: {
                companyId,
                createdAt: { gte: startDate }
            },
            _sum: { totalAmount: true }
        });
        // Fetch purchases (purchase orders)
        const purchases = await prisma_1.default.purchaseOrder.groupBy({
            by: ['createdAt'],
            where: {
                companyId,
                createdAt: { gte: startDate }
            },
            _sum: { totalAmount: true }
        });
        // Aggregate by date
        const chartData = [];
        const dateMap = new Map();
        // Helper to format date
        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };
        // Initialize map with all dates in range
        for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
            dateMap.set(formatDate(d), { sales: 0, purchases: 0 });
        }
        invoices.forEach(inv => {
            const date = formatDate(inv.createdAt);
            if (dateMap.has(date)) {
                const current = dateMap.get(date);
                current.sales += Number(inv._sum.totalAmount) || 0;
            }
        });
        purchases.forEach(po => {
            const date = formatDate(po.createdAt);
            if (dateMap.has(date)) {
                const current = dateMap.get(date);
                current.purchases += Number(po._sum.totalAmount) || 0;
            }
        });
        dateMap.forEach((value, key) => {
            chartData.push({
                date: new Date(key).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                sales: value.sales,
                purchases: value.purchases
            });
        });
        res.json({
            success: true,
            data: chartData
        });
    }
    catch (error) {
        console.error('Sales chart error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching sales chart'
        });
    }
};
exports.getSalesChart = getSalesChart;
//# sourceMappingURL=dashboardController.js.map