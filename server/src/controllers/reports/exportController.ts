import { Response } from 'express';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import { ProtectedRequest } from '../../middleware/auth';

// CSV helper functions
const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // Escape quotes and wrap in quotes if contains comma, newline, or quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

const arrayToCSV = (headers: string[], rows: any[][]): string => {
    const headerRow = headers.map(escapeCsvValue).join(',');
    const dataRows = rows.map(row => row.map(escapeCsvValue).join(',')).join('\n');
    return `${headerRow}\n${dataRows}`;
};

// @desc    Export reports as CSV
// @route   GET /api/v1/reports/export/:type
// @access  Private
export const exportReport = async (req: ProtectedRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { type } = req.params;
        const { startDate, endDate, format = 'csv' } = req.query;

        // Parse dates
        const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate as string) : new Date();

        let headers: string[] = [];
        let rows: any[][] = [];
        let filename = `${type}_report_${new Date().toISOString().split('T')[0]}`;

        switch (type) {
            case 'sales':
            case 'invoices':
                const invoices = await prisma.invoice.findMany({
                    where: {
                        companyId,
                        invoiceDate: { gte: start, lte: end }
                    },
                    include: { customer: true },
                    orderBy: { invoiceDate: 'desc' }
                });

                headers = ['Invoice No', 'Date', 'Customer', 'GSTIN', 'Subtotal', 'Tax', 'Total', 'Paid', 'Balance', 'Status'];
                rows = invoices.map(inv => [
                    inv.invoiceNumber,
                    inv.invoiceDate.toISOString().split('T')[0],
                    inv.customer.name,
                    inv.customer.gstin || '',
                    Number(inv.subtotal),
                    Number(inv.totalTax),
                    Number(inv.totalAmount),
                    Number(inv.amountPaid),
                    Number(inv.balanceAmount),
                    inv.status
                ]);
                filename = `sales_report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`;
                break;

            case 'purchase':
            case 'purchases':
                const purchases = await prisma.purchaseOrder.findMany({
                    where: {
                        companyId,
                        orderDate: { gte: start, lte: end }
                    },
                    include: { supplier: true },
                    orderBy: { orderDate: 'desc' }
                });

                headers = ['Order No', 'Date', 'Supplier', 'GSTIN', 'Subtotal', 'Tax', 'Total', 'Paid', 'Status'];
                rows = purchases.map(po => [
                    po.orderNumber,
                    po.orderDate.toISOString().split('T')[0],
                    po.supplier.name,
                    po.supplier.gstin || '',
                    Number(po.subtotal),
                    Number(po.totalTax),
                    Number(po.totalAmount),
                    Number(po.paidAmount),
                    po.status
                ]);
                filename = `purchase_report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`;
                break;

            case 'expenses':
                const expenses = await prisma.expense.findMany({
                    where: {
                        companyId,
                        date: { gte: start, lte: end }
                    },
                    orderBy: { date: 'desc' }
                });

                headers = ['Date', 'Category', 'Vendor', 'Description', 'Amount', 'GST', 'Payment Method', 'Status'];
                rows = expenses.map(exp => [
                    exp.date.toISOString().split('T')[0],
                    exp.category,
                    exp.vendor || '',
                    exp.description || '',
                    Number(exp.amount),
                    Number(exp.gstAmount),
                    exp.paymentMethod || '',
                    exp.status
                ]);
                filename = `expense_report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`;
                break;

            case 'inventory':
            case 'products':
                const products = await prisma.product.findMany({
                    where: { companyId, isActive: true },
                    orderBy: { name: 'asc' }
                });

                headers = ['SKU', 'Name', 'Category', 'HSN', 'Unit', 'Stock', 'Min Stock', 'Purchase Price', 'Selling Price', 'MRP', 'GST Rate'];
                rows = products.map(p => [
                    p.code || '',
                    p.name,
                    p.category || '',
                    p.hsnCode || '',
                    p.unit,
                    p.currentStock,
                    p.minStock,
                    Number(p.purchasePrice),
                    Number(p.sellingPrice),
                    Number(p.mrp || 0),
                    Number(p.gstRate)
                ]);
                filename = `inventory_report_${new Date().toISOString().split('T')[0]}`;
                break;

            case 'parties':
            case 'customers':
            case 'suppliers':
                const partyFilter: any = { companyId, isActive: true };
                if (type === 'customers') partyFilter.type = 'CUSTOMER';
                if (type === 'suppliers') partyFilter.type = 'SUPPLIER';

                const parties = await prisma.party.findMany({
                    where: partyFilter,
                    orderBy: { name: 'asc' }
                });

                headers = ['Name', 'Type', 'GSTIN', 'PAN', 'Email', 'Phone', 'Opening Balance', 'Current Balance'];
                rows = parties.map(p => [
                    p.name,
                    p.type,
                    p.gstin || '',
                    p.pan || '',
                    p.email || '',
                    p.phone || '',
                    Number(p.openingBalance),
                    Number(p.currentBalance)
                ]);
                filename = `${type}_report_${new Date().toISOString().split('T')[0]}`;
                break;

            case 'profit-loss':
                // Get aggregated P&L data
                const totalSales = await prisma.invoice.aggregate({
                    where: { companyId, invoiceDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
                    _sum: { totalAmount: true, amountPaid: true }
                });

                const totalPurchases = await prisma.purchaseOrder.aggregate({
                    where: { companyId, orderDate: { gte: start, lte: end } },
                    _sum: { totalAmount: true }
                });

                const totalExpenses = await prisma.expense.aggregate({
                    where: { companyId, date: { gte: start, lte: end } },
                    _sum: { amount: true }
                });

                headers = ['Metric', 'Amount'];
                const revenue = Number(totalSales._sum.totalAmount || 0);
                const cogs = Number(totalPurchases._sum.totalAmount || 0);
                const opex = Number(totalExpenses._sum.amount || 0);

                rows = [
                    ['Total Revenue', revenue],
                    ['Cost of Goods Sold', cogs],
                    ['Gross Profit', revenue - cogs],
                    ['Operating Expenses', opex],
                    ['Net Profit', revenue - cogs - opex],
                    ['Gross Margin (%)', revenue > 0 ? ((revenue - cogs) / revenue * 100).toFixed(2) : 0],
                    ['Net Margin (%)', revenue > 0 ? ((revenue - cogs - opex) / revenue * 100).toFixed(2) : 0]
                ];
                filename = `profit_loss_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: `Invalid report type: ${type}. Valid types: sales, purchase, expenses, inventory, parties, customers, suppliers, profit-loss`
                });
        }

        // Generate CSV
        const csvContent = arrayToCSV(headers, rows);

        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);

        return res.status(200).send(csvContent);

    } catch (error: any) {
        logger.error('Export report error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error exporting report'
        });
    }
};

export default { exportReport };
