/**
 * Transaction Reports Controller
 * 
 * Handles Sales, Purchase, Inventory, and Party Statement reports.
 * Split from reportsController.ts for better maintainability.
 */

import { Response } from 'express';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import { ProtectedRequest } from '../../middleware/auth';

// Sales Report
export const getSalesReport = async (req: ProtectedRequest, res: Response) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        const companyId = req.user.companyId;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate as string) : new Date();

        const invoices = await prisma.invoice.findMany({
            where: {
                companyId,
                invoiceDate: { gte: start, lte: end },
                status: { not: 'CANCELLED' }
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                invoiceDate: 'asc'
            }
        });

        const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const totalInvoices = invoices.length;
        const averageOrderValue = totalInvoices > 0 ? totalSales / totalInvoices : 0;

        // Top customers
        const customerSales = invoices.reduce((acc: any, inv) => {
            const customerId = inv.customerId;
            if (!acc[customerId]) {
                acc[customerId] = {
                    name: inv.customer?.name,
                    totalSales: 0,
                    invoiceCount: 0
                };
            }
            acc[customerId].totalSales += Number(inv.totalAmount);
            acc[customerId].invoiceCount += 1;
            return acc;
        }, {});

        const topCustomers = Object.values(customerSales)
            .sort((a: any, b: any) => b.totalSales - a.totalSales)
            .slice(0, 10);

        // Top products
        const productSales: any = {};
        invoices.forEach(inv => {
            inv.items.forEach(item => {
                const productId = item.productId || 'unknown';
                if (!productSales[productId]) {
                    productSales[productId] = {
                        name: item.productName,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[productId].quantity += item.quantity;
                productSales[productId].revenue += Number(item.total);
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a: any, b: any) => b.revenue - a.revenue)
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                period: { startDate: start, endDate: end },
                summary: {
                    totalSales,
                    totalInvoices,
                    averageOrderValue
                },
                topCustomers,
                topProducts,
                invoices: invoices.map(inv => ({
                    invoiceNumber: inv.invoiceNumber,
                    date: inv.invoiceDate,
                    customer: inv.customer?.name,
                    amount: Number(inv.totalAmount),
                    status: inv.status
                }))
            }
        });
    } catch (error: any) {
        logger.error('Get sales report error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating sales report'
        });
    }
};

// Purchase Report
export const getPurchaseReport = async (req: ProtectedRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const companyId = req.user.companyId;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate as string) : new Date();

        const purchases = await prisma.purchaseOrder.findMany({
            where: {
                companyId,
                orderDate: { gte: start, lte: end }
            },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                orderDate: 'desc'
            }
        });

        const totalPurchases = purchases.reduce((sum, po) => sum + Number(po.totalAmount), 0);
        const totalOrders = purchases.length;

        // Top suppliers
        const supplierPurchases = purchases.reduce((acc: any, po) => {
            const supplierId = po.supplierId;
            if (!acc[supplierId]) {
                acc[supplierId] = {
                    name: po.supplier?.name,
                    totalPurchases: 0,
                    orderCount: 0
                };
            }
            acc[supplierId].totalPurchases += Number(po.totalAmount);
            acc[supplierId].orderCount += 1;
            return acc;
        }, {});

        const topSuppliers = Object.values(supplierPurchases)
            .sort((a: any, b: any) => b.totalPurchases - a.totalPurchases)
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                period: { startDate: start, endDate: end },
                summary: {
                    totalPurchases,
                    totalOrders,
                    averageOrderValue: totalOrders > 0 ? totalPurchases / totalOrders : 0
                },
                topSuppliers,
                purchases: purchases.map(po => ({
                    orderNumber: po.orderNumber,
                    date: po.orderDate,
                    supplier: po.supplier?.name,
                    amount: Number(po.totalAmount),
                    status: po.status
                }))
            }
        });
    } catch (error: any) {
        logger.error('Get purchase report error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating purchase report'
        });
    }
};

// Inventory Report
export const getInventoryReport = async (req: ProtectedRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;

        const products = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        const totalProducts = products.length;
        const totalValue = products.reduce((sum, p) => sum + (p.currentStock * Number(p.purchasePrice)), 0);
        const lowStockProducts = products.filter(p => p.currentStock <= p.minStock);
        const outOfStockProducts = products.filter(p => p.currentStock === 0);

        // Category-wise breakdown
        const categoryBreakdown = products.reduce((acc: any, p) => {
            const category = p.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = {
                    count: 0,
                    totalValue: 0,
                    totalStock: 0
                };
            }
            acc[category].count += 1;
            acc[category].totalValue += p.currentStock * Number(p.purchasePrice);
            acc[category].totalStock += p.currentStock;
            return acc;
        }, {});

        return res.json({
            success: true,
            data: {
                summary: {
                    totalProducts,
                    totalValue,
                    lowStockCount: lowStockProducts.length,
                    outOfStockCount: outOfStockProducts.length
                },
                categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
                    category,
                    ...(data as object)
                })),
                lowStockProducts: lowStockProducts.map(p => ({
                    name: p.name,
                    currentStock: p.currentStock,
                    minStock: p.minStock,
                    value: p.currentStock * Number(p.purchasePrice)
                })),
                products: products.map(p => ({
                    name: p.name,
                    category: p.category,
                    currentStock: p.currentStock,
                    value: p.currentStock * Number(p.purchasePrice)
                }))
            }
        });
    } catch (error: any) {
        logger.error('Get inventory report error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error generating inventory report'
        });
    }
};

// Party Statement (Customer/Supplier ledger)
export const getPartyStatement = async (req: ProtectedRequest, res: Response) => {
    try {
        const { partyId } = req.params;
        const { startDate, endDate } = req.query;
        const companyId = req.user.companyId;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate as string) : new Date();

        const party = await prisma.party.findFirst({
            where: { id: partyId, companyId }
        });

        if (!party) {
            return res.status(404).json({
                success: false,
                message: 'Party not found'
            });
        }

        // Get all transactions
        const invoices = await prisma.invoice.findMany({
            where: {
                customerId: partyId,
                invoiceDate: { gte: start, lte: end }
            },
            orderBy: { invoiceDate: 'asc' }
        });

        const purchases = await prisma.purchaseOrder.findMany({
            where: {
                supplierId: partyId,
                orderDate: { gte: start, lte: end }
            },
            orderBy: { orderDate: 'asc' }
        });

        const transactions: any[] = [];
        let runningBalance = Number(party.openingBalance);

        invoices.forEach(inv => {
            runningBalance += Number(inv.totalAmount);
            transactions.push({
                date: inv.invoiceDate,
                type: 'Invoice',
                reference: inv.invoiceNumber,
                debit: Number(inv.totalAmount),
                credit: 0,
                balance: runningBalance
            });

            if (Number(inv.amountPaid) > 0) {
                runningBalance -= Number(inv.amountPaid);
                transactions.push({
                    date: inv.invoiceDate,
                    type: 'Payment',
                    reference: inv.invoiceNumber,
                    debit: 0,
                    credit: Number(inv.amountPaid),
                    balance: runningBalance
                });
            }
        });

        purchases.forEach(po => {
            runningBalance -= Number(po.totalAmount);
            transactions.push({
                date: po.orderDate,
                type: 'Purchase',
                reference: po.orderNumber,
                debit: 0,
                credit: Number(po.totalAmount),
                balance: runningBalance
            });

            if (Number(po.paidAmount) > 0) {
                runningBalance += Number(po.paidAmount);
                transactions.push({
                    date: po.orderDate,
                    type: 'Payment',
                    reference: po.orderNumber,
                    debit: Number(po.paidAmount),
                    credit: 0,
                    balance: runningBalance
                });
            }
        });

        // Sort by date
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return res.json({
            success: true,
            data: {
                party: {
                    name: party.name,
                    type: party.type,
                    gstin: party.gstin
                },
                period: { startDate: start, endDate: end },
                openingBalance: Number(party.openingBalance),
                closingBalance: runningBalance,
                transactions
            }
        });
    } catch (error: any) {
        logger.error('Get party statement error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error generating party statement'
        });
    }
};

// Supplier Dependency Analysis
export const analyzeConcentration = async (req: ProtectedRequest, res: Response) => {
    try {
        const supplierService = (await import('../../services/supplierDependencyService')).default;
        const companyId = req.user.companyId;
        const months = parseInt(req.query.months as string) || 12;
        const data = await supplierService.analyzeConcentration(companyId, months);
        res.json({ success: true, data });
    } catch (error: any) {
        logger.error('Supplier dependency error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

