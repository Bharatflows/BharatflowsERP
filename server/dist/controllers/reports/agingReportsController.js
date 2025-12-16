"use strict";
/**
 * Aging Reports Controller
 *
 * Handles Aging Receivables and Aging Payables reports.
 * Split from reportsController.ts for better maintainability.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgingPayables = exports.getAgingReceivables = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
// Aging Report - Receivables
const getAgingReceivables = async (req, res) => {
    try {
        // @ts-ignore
        const companyId = req.user.companyId;
        const invoices = await prisma_1.default.invoice.findMany({
            where: {
                companyId,
                status: { not: 'CANCELLED' },
                balanceAmount: { gt: 0 }
            },
            include: {
                customer: true
            },
            orderBy: {
                invoiceDate: 'desc'
            }
        });
        const today = new Date();
        const agingBuckets = {
            current: 0,
            days31to60: 0,
            days61to90: 0,
            over90: 0
        };
        const customerAging = [];
        invoices.forEach(inv => {
            const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.invoiceDate);
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const balance = Number(inv.balanceAmount);
            if (daysOverdue <= 30)
                agingBuckets.current += balance;
            else if (daysOverdue <= 60)
                agingBuckets.days31to60 += balance;
            else if (daysOverdue <= 90)
                agingBuckets.days61to90 += balance;
            else
                agingBuckets.over90 += balance;
            customerAging.push({
                invoiceNumber: inv.invoiceNumber,
                customerName: inv.customer?.name,
                invoiceDate: inv.invoiceDate,
                dueDate: inv.dueDate,
                totalAmount: Number(inv.totalAmount),
                balanceAmount: balance,
                daysOverdue
            });
        });
        res.json({
            success: true,
            data: {
                summary: agingBuckets,
                totalReceivables: Object.values(agingBuckets).reduce((sum, val) => sum + val, 0),
                details: customerAging
            }
        });
    }
    catch (error) {
        console.error('Get aging receivables error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating aging report'
        });
    }
};
exports.getAgingReceivables = getAgingReceivables;
// Aging Report - Payables
const getAgingPayables = async (req, res) => {
    try {
        // @ts-ignore
        const companyId = req.user.companyId;
        const purchases = await prisma_1.default.purchaseOrder.findMany({
            where: {
                companyId,
                paidAmount: { lt: prisma_1.default.purchaseOrder.fields.totalAmount }
            },
            include: {
                supplier: true
            },
            orderBy: {
                orderDate: 'desc'
            }
        });
        const today = new Date();
        const agingBuckets = {
            current: 0,
            days31to60: 0,
            days61to90: 0,
            over90: 0
        };
        const supplierAging = [];
        purchases.forEach(po => {
            const daysAge = Math.floor((today.getTime() - new Date(po.orderDate).getTime()) / (1000 * 60 * 60 * 24));
            const balance = Number(po.totalAmount) - Number(po.paidAmount);
            if (daysAge <= 30)
                agingBuckets.current += balance;
            else if (daysAge <= 60)
                agingBuckets.days31to60 += balance;
            else if (daysAge <= 90)
                agingBuckets.days61to90 += balance;
            else
                agingBuckets.over90 += balance;
            supplierAging.push({
                orderNumber: po.orderNumber,
                supplierName: po.supplier?.name,
                orderDate: po.orderDate,
                totalAmount: Number(po.totalAmount),
                paidAmount: Number(po.paidAmount),
                balanceAmount: balance,
                daysAge
            });
        });
        res.json({
            success: true,
            data: {
                summary: agingBuckets,
                totalPayables: Object.values(agingBuckets).reduce((sum, val) => sum + val, 0),
                details: supplierAging
            }
        });
    }
    catch (error) {
        console.error('Get aging payables error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating aging report'
        });
    }
};
exports.getAgingPayables = getAgingPayables;
//# sourceMappingURL=agingReportsController.js.map