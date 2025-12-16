"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGSTDashboard = exports.fileGSTReturn = exports.getITCLedger = exports.getHSNSummary = exports.createEWayBill = exports.generateGSTR3B = exports.generateGSTR1 = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
// Generate GSTR1 Report
const generateGSTR1 = async (req, res) => {
    try {
        const { month, year } = req.query;
        // @ts-ignore
        const companyId = req.user.companyId;
        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year are required'
            });
        }
        // Calculate date range for the month
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        // Get all invoices for the period
        const invoices = await prisma_1.default.invoice.findMany({
            where: {
                companyId,
                invoiceDate: {
                    gte: startDate,
                    lte: endDate
                },
                status: {
                    not: 'CANCELLED'
                }
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        // Group by tax rate for B2B transactions
        const b2bTransactions = [];
        const hsnSummary = new Map();
        invoices.forEach(invoice => {
            // B2B Transaction
            if (invoice.customer?.gstin) {
                b2bTransactions.push({
                    gstin: invoice.customer.gstin,
                    name: invoice.customer.name,
                    invoiceNumber: invoice.invoiceNumber,
                    invoiceDate: invoice.invoiceDate,
                    invoiceValue: Number(invoice.totalAmount),
                    placeOfSupply: invoice.customer?.billingAddress,
                    taxableValue: Number(invoice.subtotal),
                    cgst: Number(invoice.totalTax) / 2,
                    sgst: Number(invoice.totalTax) / 2,
                    igst: 0
                });
            }
            // HSN Summary
            invoice.items.forEach(item => {
                const hsnCode = item.product?.hsnCode || 'UNCLASSIFIED';
                if (!hsnSummary.has(hsnCode)) {
                    hsnSummary.set(hsnCode, {
                        hsnCode,
                        description: item.product?.name || item.productName,
                        uqc: item.product?.unit || 'PCS',
                        totalQuantity: 0,
                        totalValue: 0,
                        taxableValue: 0,
                        cgst: 0,
                        sgst: 0,
                        igst: 0
                    });
                }
                const summary = hsnSummary.get(hsnCode);
                summary.totalQuantity += item.quantity;
                summary.totalValue += Number(item.total);
                summary.taxableValue += Number(item.total) - Number(item.taxAmount);
                summary.cgst += Number(item.taxAmount) / 2;
                summary.sgst += Number(item.taxAmount) / 2;
            });
        });
        const gstr1Data = {
            gstin: '', // Company GSTIN - fetch from company
            period: `${month}${year}`,
            b2b: b2bTransactions,
            hsn: Array.from(hsnSummary.values()),
            summary: {
                totalInvoices: invoices.length,
                totalTaxableValue: invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0),
                totalTax: invoices.reduce((sum, inv) => sum + Number(inv.totalTax), 0),
                totalInvoiceValue: invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
            }
        };
        return res.json({
            success: true,
            data: gstr1Data
        });
    }
    catch (error) {
        console.error('Generate GSTR1 error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error generating GSTR1'
        });
    }
};
exports.generateGSTR1 = generateGSTR1;
// Generate GSTR3B Report
const generateGSTR3B = async (req, res) => {
    try {
        const { month, year } = req.query;
        // @ts-ignore
        const companyId = req.user.companyId;
        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year are required'
            });
        }
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        // Outward Supplies (Sales/Invoices)
        const outwardSupplies = await prisma_1.default.invoice.findMany({
            where: {
                companyId,
                invoiceDate: { gte: startDate, lte: endDate },
                status: { not: 'CANCELLED' }
            }
        });
        // Inward Supplies (Purchases)
        const inwardSupplies = await prisma_1.default.purchaseOrder.findMany({
            where: {
                companyId,
                orderDate: { gte: startDate, lte: endDate }
            }
        });
        const gstr3bData = {
            gstin: '', // Company GSTIN
            period: `${month}${year}`,
            outwardSupplies: {
                taxableValue: outwardSupplies.reduce((sum, inv) => sum + Number(inv.subtotal), 0),
                cgst: outwardSupplies.reduce((sum, inv) => sum + Number(inv.totalTax) / 2, 0),
                sgst: outwardSupplies.reduce((sum, inv) => sum + Number(inv.totalTax) / 2, 0),
                igst: 0,
                cess: 0
            },
            inwardSupplies: {
                taxableValue: inwardSupplies.reduce((sum, po) => sum + Number(po.subtotal), 0),
                cgst: inwardSupplies.reduce((sum, po) => sum + Number(po.totalTax) / 2, 0),
                sgst: inwardSupplies.reduce((sum, po) => sum + Number(po.totalTax) / 2, 0),
                igst: 0,
                cess: 0
            },
            itcAvailable: {
                cgst: inwardSupplies.reduce((sum, po) => sum + Number(po.totalTax) / 2, 0),
                sgst: inwardSupplies.reduce((sum, po) => sum + Number(po.totalTax) / 2, 0),
                igst: 0,
                cess: 0
            },
            taxPayable: {
                cgst: Math.max(0, outwardSupplies.reduce((sum, inv) => sum + Number(inv.totalTax) / 2, 0) -
                    inwardSupplies.reduce((sum, po) => sum + Number(po.totalTax) / 2, 0)),
                sgst: Math.max(0, outwardSupplies.reduce((sum, inv) => sum + Number(inv.totalTax) / 2, 0) -
                    inwardSupplies.reduce((sum, po) => sum + Number(po.totalTax) / 2, 0)),
                igst: 0,
                cess: 0
            }
        };
        return res.json({
            success: true,
            data: gstr3bData
        });
    }
    catch (error) {
        console.error('Generate GSTR3B error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error generating GSTR3B'
        });
    }
};
exports.generateGSTR3B = generateGSTR3B;
// Create E-Way Bill
const createEWayBill = async (req, res) => {
    try {
        const { invoiceId, transporterName, transporterId, vehicleNumber, vehicleType, distance, transactionType, supplyType, subSupplyType } = req.body;
        // @ts-ignore
        const companyId = req.user.companyId;
        // Get invoice details
        const invoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: invoiceId,
                companyId
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }
        const eWayBill = {
            ewbNumber: `EWB${Date.now()}`, // In production, this would be from GST portal
            generatedDate: new Date(),
            validUntil: new Date(Date.now() + (distance > 200 ? 2 : 1) * 24 * 60 * 60 * 1000),
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            from: {
                gstin: '', // Company GSTIN
                name: '', // Company name
                address: '' // Company address
            },
            to: {
                gstin: invoice.customer?.gstin,
                name: invoice.customer?.name,
                address: invoice.customer?.billingAddress
            },
            transporter: {
                name: transporterName,
                id: transporterId
            },
            vehicle: {
                number: vehicleNumber,
                type: vehicleType
            },
            distance,
            transactionType,
            supplyType,
            subSupplyType,
            totalValue: Number(invoice.totalAmount),
            cgst: Number(invoice.totalTax) / 2,
            sgst: Number(invoice.totalTax) / 2,
            items: invoice.items.map(item => ({
                hsnCode: item.product?.hsnCode,
                productName: item.productName,
                quantity: item.quantity,
                taxableValue: Number(item.total) - Number(item.taxAmount),
                taxRate: Number(item.taxRate)
            }))
        };
        return res.status(201).json({
            success: true,
            data: eWayBill
        });
    }
    catch (error) {
        console.error('Create E-Way Bill error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error creating E-Way Bill'
        });
    }
};
exports.createEWayBill = createEWayBill;
// Get HSN/SAC Summary
const getHSNSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // @ts-ignore
        const companyId = req.user.companyId;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();
        const invoices = await prisma_1.default.invoice.findMany({
            where: {
                companyId,
                invoiceDate: { gte: start, lte: end },
                status: { not: 'CANCELLED' }
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        const hsnMap = new Map();
        invoices.forEach(invoice => {
            invoice.items.forEach(item => {
                const hsnCode = item.product?.hsnCode || 'UNCLASSIFIED';
                if (!hsnMap.has(hsnCode)) {
                    hsnMap.set(hsnCode, {
                        hsnCode,
                        description: item.product?.name || item.productName,
                        uqc: item.product?.unit || 'PCS',
                        totalQuantity: 0,
                        totalValue: 0,
                        taxableValue: 0,
                        cgst: 0,
                        sgst: 0,
                        igst: 0,
                        totalTax: 0,
                        invoiceCount: new Set()
                    });
                }
                const summary = hsnMap.get(hsnCode);
                summary.totalQuantity += item.quantity;
                const itemValue = Number(item.total);
                const itemTax = Number(item.taxAmount);
                summary.totalValue += itemValue;
                summary.taxableValue += itemValue - itemTax;
                summary.cgst += itemTax / 2;
                summary.sgst += itemTax / 2;
                summary.totalTax += itemTax;
                summary.invoiceCount.add(invoice.id);
            });
        });
        const hsnSummary = Array.from(hsnMap.values()).map(item => ({
            ...item,
            invoiceCount: item.invoiceCount.size
        }));
        res.json({
            success: true,
            data: hsnSummary
        });
    }
    catch (error) {
        console.error('Get HSN Summary error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting HSN summary'
        });
    }
};
exports.getHSNSummary = getHSNSummary;
// Get ITC (Input Tax Credit) Ledger
const getITCLedger = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // @ts-ignore
        const companyId = req.user.companyId;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();
        const purchases = await prisma_1.default.purchaseOrder.findMany({
            where: {
                companyId,
                orderDate: { gte: start, lte: end }
            },
            include: {
                supplier: true,
                items: true
            },
            orderBy: {
                orderDate: 'desc'
            }
        });
        const itcEntries = purchases.map(po => ({
            id: po.id,
            documentNumber: po.orderNumber,
            documentDate: po.orderDate,
            supplierName: po.supplier?.name,
            supplierGSTIN: po.supplier?.gstin,
            taxableValue: Number(po.subtotal),
            cgst: Number(po.totalTax) / 2,
            sgst: Number(po.totalTax) / 2,
            igst: 0,
            totalTax: Number(po.totalTax),
            itcAvailed: Number(po.totalTax),
            reversal: 0,
            netITC: Number(po.totalTax)
        }));
        const summary = {
            totalTaxableValue: itcEntries.reduce((sum, entry) => sum + entry.taxableValue, 0),
            totalCGST: itcEntries.reduce((sum, entry) => sum + entry.cgst, 0),
            totalSGST: itcEntries.reduce((sum, entry) => sum + entry.sgst, 0),
            totalIGST: 0,
            totalITC: itcEntries.reduce((sum, entry) => sum + entry.netITC, 0)
        };
        res.json({
            success: true,
            data: {
                entries: itcEntries,
                summary
            }
        });
    }
    catch (error) {
        console.error('Get ITC Ledger error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting ITC ledger'
        });
    }
};
exports.getITCLedger = getITCLedger;
// File GST Return (placeholder - would integrate with GST portal in production)
const fileGSTReturn = async (req, res) => {
    try {
        const { returnType, month, year, data } = req.body;
        // @ts-ignore
        const companyId = req.user.companyId;
        // In production, this would:
        // 1. Validate the return data
        // 2. Generate JSON for GST portal
        // 3. Call GST API to submit
        // 4. Store acknowledgment
        const filingRecord = {
            id: `FILING_${Date.now()}`,
            returnType, // GSTR1, GSTR3B, etc.
            period: `${month}${year}`,
            filedDate: new Date(),
            status: 'FILED',
            acknowledgmentNumber: `ACK${Date.now()}`,
            companyId
        };
        res.json({
            success: true,
            message: 'GST return filed successfully',
            data: filingRecord
        });
    }
    catch (error) {
        console.error('File GST Return error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error filing GST return'
        });
    }
};
exports.fileGSTReturn = fileGSTReturn;
// Get GST Dashboard Summary
const getGSTDashboard = async (req, res) => {
    try {
        // @ts-ignore
        const companyId = req.user.companyId;
        // Get current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        // Get current month invoices (output tax)
        const invoices = await prisma_1.default.invoice.findMany({
            where: {
                companyId,
                invoiceDate: { gte: startOfMonth, lte: endOfMonth },
                status: { not: 'CANCELLED' }
            }
        });
        // Get current month purchases (input tax)
        const purchases = await prisma_1.default.purchaseOrder.findMany({
            where: {
                companyId,
                orderDate: { gte: startOfMonth, lte: endOfMonth }
            }
        });
        // Calculate tax summary
        const outputTax = invoices.reduce((sum, inv) => sum + Number(inv.totalTax), 0);
        const inputTax = purchases.reduce((sum, po) => sum + Number(po.totalTax), 0);
        const taxLiability = Math.max(0, outputTax - inputTax);
        const itcAvailable = inputTax;
        // Calculate filing deadlines based on current month
        const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthName = prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        // GSTR-1 is due on 11th of next month, GSTR-3B is due on 20th
        const gstr1DueDate = new Date(now.getFullYear(), now.getMonth() + 1, 11);
        const gstr3bDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 20);
        const calculateDaysLeft = (dueDate) => {
            const diff = dueDate.getTime() - now.getTime();
            return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        };
        const upcomingDeadlines = [
            {
                return: 'GSTR-1',
                period: currentMonth,
                dueDate: gstr1DueDate.toISOString().split('T')[0],
                daysLeft: calculateDaysLeft(gstr1DueDate)
            },
            {
                return: 'GSTR-3B',
                period: currentMonth,
                dueDate: gstr3bDueDate.toISOString().split('T')[0],
                daysLeft: calculateDaysLeft(gstr3bDueDate)
            }
        ];
        // Filing status (simulated - in production would come from GSTFiling model)
        const filingStatus = [
            {
                return: 'GSTR-1',
                period: prevMonthName,
                dueDate: new Date(now.getFullYear(), now.getMonth(), 11).toISOString().split('T')[0],
                status: 'filed',
                filedOn: new Date(now.getFullYear(), now.getMonth(), 8).toISOString().split('T')[0]
            },
            {
                return: 'GSTR-3B',
                period: prevMonthName,
                dueDate: new Date(now.getFullYear(), now.getMonth(), 20).toISOString().split('T')[0],
                status: 'filed',
                filedOn: new Date(now.getFullYear(), now.getMonth(), 18).toISOString().split('T')[0]
            },
            {
                return: 'GSTR-1',
                period: currentMonth,
                dueDate: gstr1DueDate.toISOString().split('T')[0],
                status: 'pending',
                filedOn: null
            },
            {
                return: 'GSTR-3B',
                period: currentMonth,
                dueDate: gstr3bDueDate.toISOString().split('T')[0],
                status: 'pending',
                filedOn: null
            }
        ];
        res.json({
            success: true,
            data: {
                currentMonth,
                gstSummary: {
                    outputTax,
                    inputTax,
                    taxLiability,
                    itcAvailable
                },
                filingStatus,
                upcomingDeadlines,
                recentPayments: [] // Would come from payment records
            }
        });
    }
    catch (error) {
        console.error('Get GST Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting GST dashboard'
        });
    }
};
exports.getGSTDashboard = getGSTDashboard;
//# sourceMappingURL=gstController.js.map