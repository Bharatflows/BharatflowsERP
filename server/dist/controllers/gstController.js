"use strict";
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
exports.getGSTR1Extended = exports.createAmendment = exports.getAmendments = exports.getGSTR2BRecords = exports.syncGSTR2B = exports.generateEInvoice = exports.getGSTHistory = exports.exportGSTR1JSON = exports.exportGSTR3BExcel = exports.exportGSTR1Excel = exports.getGSTR3BReportSummary = exports.getGSTR1ReportSummary = exports.getGSTDashboard = exports.fileGSTReturn = exports.getITCLedger = exports.getHSNSummary = exports.createEWayBill = exports.generateGSTR3B = exports.generateGSTR1 = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const gstService_1 = require("../services/gstService");
const gstIntegrationService_1 = require("../services/gstIntegrationService");
const validationService_1 = require("../services/validationService");
const eventBus_1 = __importStar(require("../services/eventBus"));
const business_config_1 = require("../config/business.config");
const logger_1 = __importDefault(require("../config/logger"));
const ExcelJS = __importStar(require("exceljs"));
const gstReportService_1 = __importDefault(require("../services/gstReportService"));
// Generate GSTR1 Report
const generateGSTR1 = async (req, res) => {
    try {
        const { month, year } = req.query;
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
        // Fetch Company Details for Supplier State Code
        const company = await prisma_1.default.company.findUnique({
            where: { id: companyId }
        });
        const supplierStateCode = company?.gstin ? validationService_1.ValidationUtils.getGSTStateCode(company.gstin) : '00';
        invoices.forEach(invoice => {
            // B2B Transaction
            if (invoice.customer?.gstin) {
                const customerStateCode = validationService_1.ValidationUtils.getGSTStateCode(invoice.customer.gstin) || '00';
                // Calculate Tax Breakup
                const taxBreakup = gstService_1.GSTService.calculateTax(Number(invoice.subtotal), (Number(invoice.totalTax) / Number(invoice.subtotal)) * 100, // Estimate rate or derive from items (better to sum items but using avg here for report speed if items variance is low)
                supplierStateCode || '00', customerStateCode);
                // Better approach: Sum up from items if available
                let cgst = 0, sgst = 0, igst = 0;
                if (invoice.items && invoice.items.length > 0) {
                    invoice.items.forEach(item => {
                        const itemTax = gstService_1.GSTService.calculateTax(Number(item.total) - Number(item.taxAmount), Number(item.taxRate), supplierStateCode || '00', customerStateCode);
                        cgst += itemTax.cgst;
                        sgst += itemTax.sgst;
                        igst += itemTax.igst;
                    });
                }
                else {
                    // Fallback to invoice header tax
                    cgst = taxBreakup.cgst;
                    sgst = taxBreakup.sgst;
                    igst = taxBreakup.igst;
                }
                b2bTransactions.push({
                    gstin: invoice.customer.gstin,
                    name: invoice.customer.name,
                    invoiceNumber: invoice.invoiceNumber,
                    invoiceDate: invoice.invoiceDate,
                    invoiceValue: Number(invoice.totalAmount),
                    placeOfSupply: invoice.customer?.billingAddress,
                    taxableValue: Number(invoice.subtotal),
                    cgst,
                    sgst,
                    igst
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
        logger_1.default.error('Generate GSTR1 error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error generating GSTR1'
        });
    }
};
exports.generateGSTR1 = generateGSTR1;
const accountingService = __importStar(require("../services/accountingService"));
// Generate GSTR3B Report
const generateGSTR3B = async (req, res) => {
    try {
        const { month, year } = req.query;
        const companyId = req.user.companyId;
        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year are required'
            });
        }
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        // 1. Outward Supplies (Sales) - From Ledger
        // Taxable Value: Sum of SALES_ACCOUNTS (Credits)
        const salesPostings = await accountingService.getPostingsByGroup(companyId, 'SALES_ACCOUNTS', startDate, endDate);
        const taxableValue = salesPostings.reduce((sum, p) => p.type === 'CREDIT' ? sum + Number(p.amount) : sum - Number(p.amount), 0);
        // Tax Liability: Sum of DUTIES_TAXES (Credits)
        const taxPostings = await accountingService.getPostingsByGroup(companyId, 'DUTIES_TAXES', startDate, endDate);
        const calculateTaxBalance = (code) => {
            return taxPostings
                .filter(p => p.ledger.code === code)
                .reduce((sum, p) => p.type === 'CREDIT' ? sum + Number(p.amount) : sum - Number(p.amount), 0);
        };
        const outCgst = calculateTaxBalance('CGST_PAYABLE');
        const outSgst = calculateTaxBalance('SGST_PAYABLE');
        const outIgst = calculateTaxBalance('IGST_PAYABLE');
        // 2. Inward Supplies (ITC) - From Ledger
        // ITC Available: Sum of TAX_RECEIVABLES (Debits)
        const inputPostings = await accountingService.getPostingsByGroup(companyId, 'TAX_RECEIVABLES', startDate, endDate);
        // Note: Default seed has single 'GST_INPUT' ledger. 
        // Real-world scenarios might split this, but for now we aggregate.
        const totalItc = inputPostings.reduce((sum, p) => p.type === 'DEBIT' ? sum + Number(p.amount) : sum - Number(p.amount), 0);
        // Estimate ITC split based on Outward Liability Ratios or fetch from PurchaseBills if needed for display?
        // For strict Ledger Reporting, if we don't track split in ledger, we cannot report split accurately.
        // We will report total ITC in IGST slot if unclassified, or split equally? 
        // BETTER: Revert to PurchaseBill for *split* but use Ledger for *Total* validation?
        // Let's perform a hybrid: Use Ledger Total as the "ITC Available", and distribute it based on Purchase Bill proportions.
        const purchaseBills = await prisma_1.default.purchaseBill.findMany({
            where: {
                companyId,
                billDate: { gte: startDate, lte: endDate },
                status: { not: 'CANCELLED' }
            }
        });
        const billStats = purchaseBills.reduce((acc, b) => ({
            cgst: acc.cgst + (Number(b.totalTax) / 2), // Approx if not stored
            sgst: acc.sgst + (Number(b.totalTax) / 2),
            // For now assuming intra-state dominantly or using logic. 
            // Since we don't have tax breakdown columns in PurchaseBill model shown in snippet?
            // Wait, previous code used: `Number(po.totalTax) / 2`.
            // Let's check if we can get ratio.
            total: acc.total + Number(b.totalTax)
        }), { cgst: 0, sgst: 0, total: 0 });
        // Calculate Ratios
        const totalBillTax = billStats.total || 1; // Avoid divide by zero
        const cgstRatio = billStats.cgst / totalBillTax;
        // Apply to Ledger Total
        const itcCgst = totalItc * cgstRatio; // Roughly 50%
        const itcSgst = totalItc * cgstRatio; // Roughly 50%
        const itcIgst = totalItc - (itcCgst + itcSgst); // Balance (usually 0 if local)
        // 3. Purchase Taxable Value (Direct Expenses Ledger)
        const expensePostings = await accountingService.getPostingsByGroup(companyId, 'DIRECT_EXPENSES', startDate, endDate);
        const inwardTaxable = expensePostings.reduce((sum, p) => p.type === 'DEBIT' ? sum + Number(p.amount) : sum - Number(p.amount), 0);
        const gstr3bData = {
            gstin: '', // Company GSTIN
            period: `${month}${year}`,
            outwardSupplies: {
                taxableValue: Math.max(0, taxableValue),
                cgst: Math.max(0, outCgst),
                sgst: Math.max(0, outSgst),
                igst: Math.max(0, outIgst),
                cess: 0
            },
            inwardSupplies: {
                taxableValue: Math.max(0, inwardTaxable),
                cgst: Math.max(0, itcCgst),
                sgst: Math.max(0, itcSgst),
                igst: Math.max(0, itcIgst),
                cess: 0
            },
            itcAvailable: {
                cgst: Math.max(0, itcCgst),
                sgst: Math.max(0, itcSgst),
                igst: Math.max(0, itcIgst),
                cess: 0
            },
            taxPayable: {
                cgst: Math.max(0, outCgst - itcCgst),
                sgst: Math.max(0, outSgst - itcSgst),
                igst: Math.max(0, outIgst - itcIgst),
                cess: 0
            }
        };
        return res.json({
            success: true,
            data: gstr3bData
        });
    }
    catch (error) {
        logger_1.default.error('Generate GSTR3B error:', error);
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
        // Emit EWAY_BILL_CREATED event
        await eventBus_1.default.emit({
            companyId,
            eventType: eventBus_1.EventTypes.EWAY_BILL_CREATED,
            aggregateType: 'EWayBill',
            aggregateId: eWayBill.ewbNumber,
            payload: {
                ewbNumber: eWayBill.ewbNumber,
                invoiceNumber: eWayBill.invoiceNumber,
                totalValue: eWayBill.totalValue,
                validUntil: eWayBill.validUntil
            },
            metadata: { userId: req.user?.id || 'SYSTEM', source: 'api' }
        });
        return res.status(201).json({
            success: true,
            data: eWayBill
        });
    }
    catch (error) {
        logger_1.default.error('Create E-Way Bill error:', error);
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
        logger_1.default.error('Get HSN Summary error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting HSN summary'
        });
    }
};
exports.getHSNSummary = getHSNSummary;
// Get ITC (Input Tax Credit) Ledger
// Fixed: Now handles RCM and excludes DRAFT/CANCELLED bills
const getITCLedger = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const companyId = req.user.companyId;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();
        // Use PurchaseBills for ITC - exclude DRAFT/CANCELLED
        const purchaseBills = await prisma_1.default.purchaseBill.findMany({
            where: {
                companyId,
                billDate: { gte: start, lte: end },
                status: { notIn: ['DRAFT', 'CANCELLED'] }
            },
            include: {
                supplier: true,
                items: true
            },
            orderBy: {
                billDate: 'desc'
            }
        });
        // Get company state code for IGST vs CGST/SGST determination
        const company = await prisma_1.default.company.findUnique({
            where: { id: companyId },
            select: { gstin: true }
        });
        const companyStateCode = company?.gstin?.substring(0, 2) || '';
        const itcEntries = purchaseBills.map(bill => {
            const supplierStateCode = bill.supplier?.gstin?.substring(0, 2) || '';
            const isInterState = supplierStateCode && companyStateCode ? supplierStateCode !== companyStateCode : false;
            const totalTax = Number(bill.totalTax || 0);
            const isRCM = bill.isReverseCharge || false;
            // For RCM (Reverse Charge) invoices:
            // - Tax is paid by the recipient (buyer), not the supplier
            // - ITC is still claimable after paying RCM liability
            // - Flag separately for GST return purposes
            // ITC Eligibility Rules:
            // 1. Normal purchase from registered supplier: Full ITC available
            // 2. RCM purchase: ITC available after paying RCM liability
            // 3. Purchase from unregistered (no GSTIN): No ITC on normal, but RCM applicable on certain goods/services
            const hasValidGSTIN = !!bill.supplier?.gstin;
            const itcEligible = hasValidGSTIN || isRCM;
            const itcAmount = itcEligible ? totalTax : 0;
            const rcmLiability = isRCM ? totalTax : 0;
            return {
                id: bill.id,
                documentNumber: bill.billNumber,
                documentDate: bill.billDate,
                supplierName: bill.supplier?.name || 'Unknown',
                supplierGSTIN: bill.supplier?.gstin || 'Unregistered',
                taxableValue: Number(bill.subtotal || 0),
                cgst: isInterState ? 0 : totalTax / 2,
                sgst: isInterState ? 0 : totalTax / 2,
                igst: isInterState ? totalTax : 0,
                totalTax: totalTax,
                isRCM: isRCM,
                rcmLiability: rcmLiability,
                itcEligible: itcEligible,
                itcAvailed: itcAmount,
                reversal: 0,
                netITC: itcAmount
            };
        });
        // Separate RCM and normal ITC for reporting
        const rcmEntries = itcEntries.filter(e => e.isRCM);
        const normalEntries = itcEntries.filter(e => !e.isRCM);
        const summary = {
            totalTaxableValue: itcEntries.reduce((sum, entry) => sum + entry.taxableValue, 0),
            totalCGST: itcEntries.reduce((sum, entry) => sum + entry.cgst, 0),
            totalSGST: itcEntries.reduce((sum, entry) => sum + entry.sgst, 0),
            totalIGST: itcEntries.reduce((sum, entry) => sum + entry.igst, 0),
            totalITC: itcEntries.reduce((sum, entry) => sum + entry.netITC, 0),
            // RCM specific
            totalRCMLiability: rcmEntries.reduce((sum, entry) => sum + entry.rcmLiability, 0),
            rcmCount: rcmEntries.length,
            // Ineligible ITC (unregistered suppliers without RCM)
            ineligibleITC: itcEntries.filter(e => !e.itcEligible).reduce((sum, e) => sum + e.totalTax, 0)
        };
        res.json({
            success: true,
            data: {
                entries: itcEntries,
                rcmEntries: rcmEntries,
                normalEntries: normalEntries,
                summary
            }
        });
    }
    catch (error) {
        logger_1.default.error('Get ITC Ledger error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting ITC ledger'
        });
    }
};
exports.getITCLedger = getITCLedger;
// File GST Return (creates record in GSTFiling table)
const fileGSTReturn = async (req, res) => {
    try {
        const { returnType, month, year, data } = req.body;
        const companyId = req.user.companyId;
        if (!returnType || !month || !year) {
            return res.status(400).json({
                success: false,
                message: 'returnType, month, and year are required'
            });
        }
        // Calculate period string (e.g., "December 2024")
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = typeof month === 'number' ? month - 1 : parseInt(month) - 1;
        const period = `${monthNames[monthIndex]} ${year}`;
        // Calculate filing year (FY e.g., "2024-25")
        const yearNum = parseInt(year);
        const filingYear = monthIndex >= 3
            ? `${yearNum}-${(yearNum + 1).toString().slice(-2)}`
            : `${yearNum - 1}-${yearNum.toString().slice(-2)}`;
        // Calculate due date based on return type
        const dueDay = returnType === 'GSTR-1' || returnType === 'GSTR1' ? 11 : 20;
        const dueMonth = monthIndex + 1; // Due on next month
        const dueYear = dueMonth > 11 ? yearNum + 1 : yearNum;
        const dueDate = new Date(dueYear, dueMonth % 12, dueDay);
        // Calculate tax amounts from data if provided
        const outputTax = data?.outputTax || 0;
        const inputTax = data?.inputTax || 0;
        const taxPayable = Math.max(0, outputTax - inputTax);
        // Create or update the filing record
        const filingRecord = await prisma_1.default.gSTFiling.upsert({
            where: {
                returnType_period_companyId: {
                    returnType: returnType.toUpperCase().replace('-', ''),
                    period,
                    companyId
                }
            },
            update: {
                filedDate: new Date(),
                status: 'FILED',
                acknowledgmentNumber: `ACK${Date.now()}`,
                outputTax,
                inputTax,
                taxPayable,
                taxPaid: data?.taxPaid || 0,
                remarks: data?.remarks || null
            },
            create: {
                returnType: returnType.toUpperCase().replace('-', ''),
                period,
                filingYear,
                dueDate,
                filedDate: new Date(),
                status: 'FILED',
                acknowledgmentNumber: `ACK${Date.now()}`,
                outputTax,
                inputTax,
                taxPayable,
                taxPaid: data?.taxPaid || 0,
                remarks: data?.remarks || null,
                companyId
            }
        });
        // Emit GST_RETURN_FILED event
        await eventBus_1.default.emit({
            companyId,
            eventType: eventBus_1.EventTypes.GST_RETURN_FILED,
            aggregateType: 'GSTFiling',
            aggregateId: filingRecord.id,
            payload: {
                returnType: filingRecord.returnType,
                period: filingRecord.period,
                filingYear: filingRecord.filingYear,
                acknowledgmentNumber: filingRecord.acknowledgmentNumber,
                taxPayable: filingRecord.taxPayable
            },
            metadata: { userId: req.user?.id || 'SYSTEM', source: 'api' }
        });
        return res.json({
            success: true,
            message: 'GST return filed successfully',
            data: filingRecord
        });
    }
    catch (error) {
        logger_1.default.error('File GST Return error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error filing GST return'
        });
    }
};
exports.fileGSTReturn = fileGSTReturn;
// Get GST Dashboard Summary
const getGSTDashboard = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const company = await prisma_1.default.company.findUnique({
            where: { id: companyId },
            select: { gstin: true }
        });
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
        // Get current month purchase bills (input tax) - using bills instead of orders for ITC
        const purchaseBills = await prisma_1.default.purchaseBill.findMany({
            where: {
                companyId,
                billDate: { gte: startOfMonth, lte: endOfMonth }
            }
        });
        // Calculate tax summary
        const outputTax = invoices.reduce((sum, inv) => sum + Number(inv.totalTax || 0), 0);
        const inputTax = purchaseBills.reduce((sum, bill) => sum + Number(bill.totalTax || 0), 0);
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
        // Proactively create calendar tasks for upcoming deadlines
        for (const dl of upcomingDeadlines) {
            try {
                const existingTask = await prisma_1.default.activity.findFirst({
                    where: {
                        companyId,
                        type: 'TASK',
                        subject: { contains: dl.return },
                        date: new Date(dl.dueDate)
                    }
                });
                if (!existingTask) {
                    await prisma_1.default.activity.create({
                        data: {
                            companyId,
                            type: 'TASK',
                            subject: `${dl.return} Filing - ${dl.period}`,
                            description: `System reminder: GST ${dl.return} return for ${dl.period} is due on ${dl.dueDate}`,
                            date: new Date(dl.dueDate),
                            priority: 'HIGH',
                            isCompleted: false,
                            createdBy: 'SYSTEM'
                        }
                    });
                }
            }
            catch (err) {
                logger_1.default.error('Failed to create GST reminder task:', err);
            }
        }
        // Get real filing status from GSTFiling model
        const filings = await prisma_1.default.gSTFiling.findMany({
            where: { companyId },
            orderBy: { dueDate: 'desc' },
            take: 10
        });
        // Map filings to expected format
        const filingStatus = filings.length > 0 ? filings.map(filing => ({
            return: filing.returnType,
            period: filing.period,
            dueDate: filing.dueDate.toISOString().split('T')[0],
            status: filing.status
        })) : upcomingDeadlines.map(dl => ({
            return: dl.return,
            period: dl.period,
            dueDate: dl.dueDate,
            status: 'PENDING'
        }));
        const dashboardData = {
            taxSummary: {
                outputTax,
                inputTax,
                netPayable: taxLiability,
                itcAvailable
            },
            filingStatus,
            upcomingDeadlines: upcomingDeadlines.map(dl => ({
                ...dl,
                status: 'PENDING' // simplified
            }))
        };
        return res.json({
            success: true,
            data: dashboardData
        });
    }
    catch (error) {
        logger_1.default.error('Get GST Dashboard error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error getting GST dashboard'
        });
    }
};
exports.getGSTDashboard = getGSTDashboard;
// New Endpoint: GSTR-1 Report Summary (using Service)
const getGSTR1ReportSummary = async (req, res) => {
    try {
        const { month, year } = req.query;
        const companyId = req.user.companyId;
        if (!month || !year) {
            return res.status(400).json({ success: false, message: 'Month and year required' });
        }
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        const summary = await gstReportService_1.default.getGSTR1Summary(companyId, { from: startDate, to: endDate });
        return res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        logger_1.default.error('Get GSTR1 Summary error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getGSTR1ReportSummary = getGSTR1ReportSummary;
// New Endpoint: GSTR-3B Report Summary (using Service)
const getGSTR3BReportSummary = async (req, res) => {
    try {
        const { month, year } = req.query;
        const companyId = req.user.companyId;
        if (!month || !year) {
            return res.status(400).json({ success: false, message: 'Month and year required' });
        }
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        const summary = await gstReportService_1.default.getGSTR3BSummary(companyId, { from: startDate, to: endDate });
        return res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        logger_1.default.error('Get GSTR3B Summary error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getGSTR3BReportSummary = getGSTR3BReportSummary;
// Export GSTR1 Report to Excel
const exportGSTR1Excel = async (req, res) => {
    try {
        const { month, year } = req.query;
        const companyId = req.user.companyId;
        if (!month || !year) {
            res.status(400).json({ success: false, message: 'Month and year are required' });
            return;
        }
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        // Fetch Data
        const invoices = await prisma_1.default.invoice.findMany({
            where: { companyId, invoiceDate: { gte: startDate, lte: endDate }, status: { not: 'CANCELLED' } },
            include: { customer: true, items: { include: { product: true } } }
        });
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'MSME OS';
        workbook.created = new Date();
        // 1. B2B Sheet (Business to Business)
        const b2bSheet = workbook.addWorksheet('b2b');
        b2bSheet.columns = [
            { header: 'GSTIN of Recipient', key: 'gstin', width: 20 },
            { header: 'Receiver Name', key: 'name', width: 25 },
            { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
            { header: 'Invoice Date', key: 'invoiceDate', width: 15 },
            { header: 'Invoice Value', key: 'invoiceValue', width: 15 },
            { header: 'Place of Supply', key: 'placeOfSupply', width: 20 },
            { header: 'Reverse Charge', key: 'reverseCharge', width: 10 },
            { header: 'Item Type', key: 'itemType', width: 10 }, // Goods/Service
            { header: 'Rate', key: 'rate', width: 10 },
            { header: 'Taxable Value', key: 'taxableValue', width: 15 },
            { header: 'Cess Amount', key: 'cess', width: 10 }
        ];
        // 2. B2CL Sheet (Large Invoices > 2.5L to Unregistered)
        const b2clSheet = workbook.addWorksheet('b2cl');
        b2clSheet.columns = [
            { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
            { header: 'Invoice Date', key: 'invoiceDate', width: 15 },
            { header: 'Invoice Value', key: 'invoiceValue', width: 15 },
            { header: 'Place of Supply', key: 'placeOfSupply', width: 20 },
            { header: 'Rate', key: 'rate', width: 10 },
            { header: 'Taxable Value', key: 'taxableValue', width: 15 },
            { header: 'Cess Amount', key: 'cess', width: 10 }
        ];
        // 3. B2CS Sheet (Small Invoices to Unregistered)
        const b2csSheet = workbook.addWorksheet('b2cs');
        b2csSheet.columns = [
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Place of Supply', key: 'placeOfSupply', width: 20 },
            { header: 'Rate', key: 'rate', width: 10 },
            { header: 'Taxable Value', key: 'taxableValue', width: 15 },
            { header: 'Cess Amount', key: 'cess', width: 10 },
            { header: 'E-Commerce GSTIN', key: 'ecommerce_gstin', width: 20 }
        ];
        // 4. HSN Sheet
        const hsnSheet = workbook.addWorksheet('hsn');
        hsnSheet.columns = [
            { header: 'HSN/SAC', key: 'hsn', width: 15 },
            { header: 'Description', key: 'desc', width: 30 },
            { header: 'UQC', key: 'uqc', width: 10 },
            { header: 'Total Quantity', key: 'qty', width: 15 },
            { header: 'Total Value', key: 'totalValue', width: 15 },
            { header: 'Taxable Value', key: 'taxableValue', width: 15 },
            { header: 'Integrated Tax Amount', key: 'igst', width: 15 },
            { header: 'Central Tax Amount', key: 'cgst', width: 15 },
            { header: 'State/UT Tax Amount', key: 'sgst', width: 15 },
            { header: 'Cess Amount', key: 'cess', width: 10 }
        ];
        // --- Processing Data ---
        const hsnMap = new Map();
        const b2csMap = new Map(); // Key: Pos-Rate
        for (const invoice of invoices) {
            const customerGstin = invoice.customer?.gstin;
            const isRegistered = !!customerGstin;
            const invoiceValue = Number(invoice.totalAmount);
            // B2B Handling
            if (isRegistered) {
                invoice.items.forEach(item => {
                    const taxable = Number(item.total) - Number(item.taxAmount);
                    b2bSheet.addRow({
                        gstin: customerGstin,
                        name: invoice.customer?.name,
                        invoiceNumber: invoice.invoiceNumber,
                        invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-GB'),
                        invoiceValue: invoiceValue,
                        placeOfSupply: validationService_1.ValidationUtils.getGSTStateCode(customerGstin || '') + '-' + (invoice.customer?.billingAddress?.state || ''),
                        reverseCharge: 'N',
                        itemType: 'Goods',
                        rate: item.taxRate,
                        taxableValue: taxable,
                        cess: 0
                    });
                });
            }
            // B2CL Handling (> 2.5L and Inter-state)
            else if (invoiceValue > business_config_1.GST_THRESHOLDS.B2C_LARGE_INVOICE && invoice.customer?.billingAddress?.state /* Check interstate logic properly in real scenario */) {
                // Simplified logic: treat all > 2.5L unreg as B2CL for now
                invoice.items.forEach(item => {
                    b2clSheet.addRow({
                        invoiceNumber: invoice.invoiceNumber,
                        invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-GB'),
                        invoiceValue: invoiceValue,
                        placeOfSupply: invoice.customer?.billingAddress?.state || 'Unknown',
                        rate: item.taxRate,
                        taxableValue: Number(item.total) - Number(item.taxAmount),
                        cess: 0
                    });
                });
            }
            // B2CS Handling
            else {
                // Aggregate by POS + Rate
                invoice.items.forEach(item => {
                    const key = `${invoice.customer?.billingAddress?.state || 'State'}-${item.taxRate}`;
                    if (!b2csMap.has(key)) {
                        b2csMap.set(key, {
                            pos: invoice.customer?.billingAddress?.state || 'State',
                            rate: item.taxRate,
                            taxable: 0
                        });
                    }
                    b2csMap.get(key).taxable += (Number(item.total) - Number(item.taxAmount));
                });
            }
            // HSN Aggregation
            invoice.items.forEach(item => {
                const code = item.product?.hsnCode || 'UNKNOWN';
                if (!hsnMap.has(code)) {
                    hsnMap.set(code, {
                        hsn: code,
                        desc: item.product?.name || item.productName,
                        uqc: item.product?.unit || 'OTH',
                        qty: 0,
                        totalVal: 0,
                        taxable: 0,
                        amount: 0 // total tax
                    });
                }
                const entry = hsnMap.get(code);
                entry.qty += item.quantity;
                entry.totalVal += Number(item.total);
                entry.taxable += (Number(item.total) - Number(item.taxAmount));
                entry.amount += Number(item.taxAmount);
            });
        }
        // Add B2CS Rows
        b2csMap.forEach(val => {
            b2csSheet.addRow({
                type: 'OE',
                placeOfSupply: val.pos,
                rate: val.rate,
                taxableValue: val.taxable,
                cess: 0,
                ecommerce_gstin: ''
            });
        });
        // Add HSN Rows
        hsnMap.forEach(val => {
            hsnSheet.addRow({
                hsn: val.hsn,
                desc: val.desc,
                uqc: val.uqc,
                qty: val.qty,
                totalValue: val.totalVal,
                taxableValue: val.taxable,
                igst: 0, // Simplified: Needs logic to split IGST/CGST based on supply type
                cgst: val.amount / 2,
                sgst: val.amount / 2,
                cess: 0
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=GSTR1_${month}_${year}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
        return;
    }
    catch (error) {
        logger_1.default.error('Export GSTR1 Excel Error:', error);
        res.status(500).json({ success: false, message: error.message });
        return;
    }
};
exports.exportGSTR1Excel = exportGSTR1Excel;
// Export GSTR3B Report to Excel
const exportGSTR3BExcel = async (req, res) => {
    try {
        const { month, year } = req.query;
        const companyId = req.user.companyId;
        if (!month || !year) {
            res.status(400).json({ success: false, message: 'Month and year are required' });
            return;
        }
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        // Fetch Data
        const outwardSupplies = await prisma_1.default.invoice.findMany({
            where: { companyId, invoiceDate: { gte: startDate, lte: endDate }, status: { not: 'CANCELLED' } }
        });
        const inwardSupplies = await prisma_1.default.purchaseBill.findMany({
            where: { companyId, billDate: { gte: startDate, lte: endDate }, status: { not: 'CANCELLED' } }
        });
        // Computations
        const outTaxable = outwardSupplies.reduce((s, i) => s + Number(i.subtotal), 0);
        const outTax = outwardSupplies.reduce((s, i) => s + Number(i.totalTax), 0);
        const inTaxable = inwardSupplies.reduce((s, i) => s + Number(i.subtotal), 0);
        const inTax = inwardSupplies.reduce((s, i) => s + Number(i.totalTax), 0);
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('GSTR-3B Summary');
        sheet.columns = [
            { header: 'Details', key: 'desc', width: 40 },
            { header: 'Taxable Value', key: 'taxable', width: 20 },
            { header: 'IGST', key: 'igst', width: 15 },
            { header: 'CGST', key: 'cgst', width: 15 },
            { header: 'SGST', key: 'sgst', width: 15 },
            { header: 'Cess', key: 'cess', width: 10 }
        ];
        sheet.addRow({
            desc: '3.1 (a) Outward Taxable Supplies (other than zero rated, nil rated and exempted)',
            taxable: outTaxable,
            igst: 0, // Simplification
            cgst: outTax / 2,
            sgst: outTax / 2,
            cess: 0
        });
        sheet.addRow({
            desc: '3.1 (b) Outward Taxable Supplies (zero rated)',
            taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0
        });
        sheet.addRow({}); // spacer
        sheet.addRow({
            desc: '4. Eligible ITC',
            taxable: '', igst: '', cgst: '', sgst: '', cess: ''
        });
        sheet.addRow({
            desc: '(A) ITC Available (whether in full or part)',
            taxable: inTaxable, // Informational
            igst: 0,
            cgst: inTax / 2,
            sgst: inTax / 2,
            cess: 0
        });
        sheet.addRow({}); // spacer
        sheet.addRow({
            desc: 'Tax Payable',
            taxable: '',
            igst: 0,
            cgst: Math.max(0, (outTax / 2) - (inTax / 2)),
            sgst: Math.max(0, (outTax / 2) - (inTax / 2)),
            cess: 0
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=GSTR3B_Summary_${month}_${year}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
        return;
    }
    catch (error) {
        logger_1.default.error('Export GSTR3B Excel Error:', error);
        res.status(500).json({ success: false, message: error.message });
        return;
    }
};
exports.exportGSTR3BExcel = exportGSTR3BExcel;
// Export GSTR1 JSON (Official Schema Placeholder)
const exportGSTR1JSON = async (req, res) => {
    try {
        // For simplicity in this P1 step, we will rely on the frontend to download the existing JSON endpoint data as a file.
        res.status(501).json({ message: "Please safe-save the JSON from the view endpoint for now." });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.exportGSTR1JSON = exportGSTR1JSON;
// Get GST History for trends (Last 6 months)
const getGSTHistory = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const monthsToFetch = 6;
        const history = [];
        for (let i = 0; i < monthsToFetch; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            const invoices = await prisma_1.default.invoice.findMany({
                where: {
                    companyId,
                    invoiceDate: { gte: startDate, lte: endDate },
                    status: { not: 'CANCELLED' }
                },
                select: { totalTax: true }
            });
            const purchases = await prisma_1.default.purchaseBill.findMany({
                where: {
                    companyId,
                    billDate: { gte: startDate, lte: endDate },
                    status: { not: 'CANCELLED' }
                },
                select: { totalTax: true }
            });
            const outputTax = invoices.reduce((sum, inv) => sum + Number(inv.totalTax), 0);
            const inputTax = purchases.reduce((sum, po) => sum + Number(po.totalTax), 0);
            history.unshift({
                month: date.toLocaleString('default', { month: 'short' }),
                year,
                collected: outputTax,
                paid: inputTax,
                net: Math.max(0, outputTax - inputTax)
            });
        }
        res.json({
            success: true,
            data: history
        });
    }
    catch (error) {
        logger_1.default.error('Get GST History error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error getting GST history'
        });
    }
};
exports.getGSTHistory = getGSTHistory;
// @desc    Generate E-Invoice for a specific invoice
// @route   POST /api/v1/gst/invoices/:id/einvoice
// @access  Private
const generateEInvoice = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const invoiceId = req.params.id;
        const result = await gstIntegrationService_1.GSTIntegrationService.generateEInvoice(invoiceId, companyId);
        return res.json(result);
    }
    catch (error) {
        logger_1.default.error('E-Invoice Controller Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error generating E-Invoice'
        });
    }
};
exports.generateEInvoice = generateEInvoice;
// @desc    Sync GSTR-2B data from portal
// @route   POST /api/v1/gst/sync-gstr2b
// @access  Private
const syncGSTR2B = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { period } = req.body;
        if (!period)
            return res.status(400).json({ success: false, message: 'Period is required' });
        const result = await gstIntegrationService_1.GSTIntegrationService.syncGSTR2B(period, companyId);
        return res.json(result);
    }
    catch (error) {
        logger_1.default.error('GSTR-2B Sync Controller Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error syncing GSTR-2B'
        });
    }
};
exports.syncGSTR2B = syncGSTR2B;
// @desc    Get GSTR-2B records for reconciliation
// @route   GET /api/v1/gst/gstr2b
// @access  Private
const getGSTR2BRecords = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { period, matchStatus } = req.query;
        const where = { companyId };
        if (period)
            where.returnPeriod = period;
        if (matchStatus)
            where.matchStatus = matchStatus;
        const records = await prisma_1.default.gSTR2BRecord.findMany({
            where,
            orderBy: { invoiceDate: 'desc' }
        });
        return res.json({
            success: true,
            data: records
        });
    }
    catch (error) {
        logger_1.default.error('Get GSTR-2B Records Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching GSTR-2B records'
        });
    }
};
exports.getGSTR2BRecords = getGSTR2BRecords;
// ============ P2: GST Amendments ============
/**
 * @desc    Get GST Amendments for a period
 * @route   GET /api/v1/gst/amendments
 * @access  Private
 */
const getAmendments = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { month, year } = req.query;
        // Placeholder: Amendments would be stored in a separate table
        // For now, return empty array
        return res.json({
            success: true,
            data: [],
            message: 'GST Amendments feature coming soon'
        });
    }
    catch (error) {
        logger_1.default.error('Get Amendments Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching amendments'
        });
    }
};
exports.getAmendments = getAmendments;
/**
 * @desc    Create GST Amendment
 * @route   POST /api/v1/gst/amendments
 * @access  Private
 */
const createAmendment = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { originalInvoiceId, amendmentType, reason } = req.body;
        // Placeholder implementation
        return res.status(201).json({
            success: true,
            data: null,
            message: 'GST Amendment creation coming soon'
        });
    }
    catch (error) {
        logger_1.default.error('Create Amendment Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error creating amendment'
        });
    }
};
exports.createAmendment = createAmendment;
/**
 * @desc    Get Extended GSTR1 (B2C Large, Exports, etc.)
 * @route   GET /api/v1/gst/gstr1-extended
 * @access  Private
 */
const getGSTR1Extended = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { month, year } = req.query;
        // Placeholder: Extended GSTR1 sections
        return res.json({
            success: true,
            data: {
                b2cLarge: [],
                exports: [],
                nilRated: [],
                advances: []
            },
            message: 'Extended GSTR1 sections'
        });
    }
    catch (error) {
        logger_1.default.error('Get GSTR1 Extended Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching extended GSTR1'
        });
    }
};
exports.getGSTR1Extended = getGSTR1Extended;
//# sourceMappingURL=gstController.js.map