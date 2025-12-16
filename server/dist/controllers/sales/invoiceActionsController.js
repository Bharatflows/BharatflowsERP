"use strict";
/**
 * Invoice Actions Controller
 *
 * Handles invoice actions: payments, status updates, PDF download, email sending.
 * Split from salesController.ts for better maintainability.
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
exports.sendInvoiceEmail = exports.downloadInvoicePDF = exports.updateInvoiceStatus = exports.recordPayment = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../config/logger"));
// @desc    Record payment against invoice
// @route   POST /api/v1/sales/invoices/:id/payment
// @access  Private
const recordPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, paymentDate, paymentMethod, reference, bankAccountId } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid payment amount is required'
            });
        }
        const invoice = await prisma_1.default.invoice.findUnique({
            where: { id },
            include: { customer: true }
        });
        if (!invoice || invoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }
        const paymentAmount = Number(amount);
        const currentBalance = Number(invoice.balanceAmount);
        if (paymentAmount > currentBalance) {
            return res.status(400).json({
                success: false,
                message: `Payment amount (${paymentAmount}) exceeds balance (${currentBalance})`
            });
        }
        const result = await prisma_1.default.$transaction(async (tx) => {
            const newPaidAmount = Number(invoice.amountPaid) + paymentAmount;
            const newBalanceAmount = currentBalance - paymentAmount;
            let newStatus = invoice.status;
            if (newBalanceAmount === 0) {
                newStatus = 'PAID';
            }
            else if (newPaidAmount > 0) {
                newStatus = 'PARTIAL';
            }
            const updatedInvoice = await tx.invoice.update({
                where: { id },
                data: {
                    amountPaid: newPaidAmount,
                    balanceAmount: newBalanceAmount,
                    status: newStatus
                },
                include: { customer: true, items: true }
            });
            await tx.party.update({
                where: { id: invoice.customerId },
                data: {
                    currentBalance: {
                        decrement: paymentAmount
                    }
                }
            });
            if (bankAccountId) {
                const bank = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
                if (bank) {
                    await tx.transaction.create({
                        data: {
                            companyId: req.user.companyId,
                            accountId: bankAccountId,
                            date: new Date(paymentDate || new Date()),
                            description: `Payment received for ${invoice.invoiceNumber}`,
                            category: 'Sales Receipt',
                            amount: paymentAmount,
                            type: 'credit',
                            reference: reference || invoice.invoiceNumber,
                            status: 'CLEARED'
                        }
                    });
                    await tx.bankAccount.update({
                        where: { id: bankAccountId },
                        data: {
                            balance: {
                                increment: paymentAmount
                            }
                        }
                    });
                }
            }
            return updatedInvoice;
        });
        logger_1.default.info(`Payment recorded: ${amount} for ${invoice.invoiceNumber} by ${req.user.email}`);
        return res.status(200).json({
            success: true,
            message: 'Payment recorded successfully',
            data: { invoice: result }
        });
    }
    catch (error) {
        logger_1.default.error('Record payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error recording payment',
            error: error.message
        });
    }
};
exports.recordPayment = recordPayment;
// @desc    Update invoice status
// @route   PUT /api/v1/sales/invoices/:id/status
// @access  Private
const updateInvoiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        const invoice = await prisma_1.default.invoice.findUnique({ where: { id } });
        if (!invoice || invoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }
        if (status === 'PAID' && Number(invoice.balanceAmount) > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot mark as PAID when balance is outstanding'
            });
        }
        const updatedInvoice = await prisma_1.default.invoice.update({
            where: { id },
            data: { status },
            include: { customer: true, items: true }
        });
        logger_1.default.info(`Invoice status updated: ${invoice.invoiceNumber} to ${status} by ${req.user.email}`);
        return res.status(200).json({
            success: true,
            message: 'Invoice status updated successfully',
            data: { invoice: updatedInvoice }
        });
    }
    catch (error) {
        logger_1.default.error('Update invoice status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating invoice status',
            error: error.message
        });
    }
};
exports.updateInvoiceStatus = updateInvoiceStatus;
// @desc    Download invoice as PDF
// @route   GET /api/v1/sales/invoices/:id/pdf
// @access  Private
const downloadInvoicePDF = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await prisma_1.default.invoice.findUnique({
            where: { id },
            include: {
                customer: true,
                items: true
            }
        });
        if (!invoice || invoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }
        const company = await prisma_1.default.company.findUnique({
            where: { id: req.user.companyId }
        });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
        const { generatePDFBuffer } = await Promise.resolve().then(() => __importStar(require('../../services/pdfService')));
        const pdfData = {
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate || undefined,
            customer: {
                name: invoice.customer?.name || 'Unknown Customer',
                email: invoice.customer?.email || undefined,
                phone: invoice.customer?.phone || undefined,
                gstNumber: invoice.customer?.gstin || undefined,
                address: invoice.customer?.billingAddress || undefined
            },
            company: {
                businessName: company.businessName,
                legalName: company.legalName || undefined,
                gstin: company.gstin || undefined,
                phone: company.phone || undefined,
                email: company.email || undefined,
                address: company.address
            },
            items: invoice.items.map((item) => ({
                productName: item.productName,
                quantity: Number(item.quantity),
                rate: Number(item.rate),
                gstRate: Number(item.gstRate || 0),
                amount: Number(item.amount || item.quantity * item.rate)
            })),
            subtotal: Number(invoice.subtotal),
            cgst: Number(invoice.cgst || 0),
            sgst: Number(invoice.sgst || 0),
            igst: Number(invoice.igst || 0),
            totalAmount: Number(invoice.totalAmount),
            amountPaid: Number(invoice.amountPaid || 0),
            balanceAmount: Number(invoice.balanceAmount || invoice.totalAmount),
            notes: invoice.notes || undefined,
            terms: invoice.terms || undefined
        };
        const pdfBuffer = await generatePDFBuffer(pdfData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
        logger_1.default.info(`PDF downloaded: ${invoice.invoiceNumber} by ${req.user.email}`);
    }
    catch (error) {
        logger_1.default.error('Download PDF error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error generating PDF',
            error: error.message
        });
    }
};
exports.downloadInvoicePDF = downloadInvoicePDF;
// @desc    Send invoice to customer via email
// @route   POST /api/v1/sales/invoices/:id/send
// @access  Private
const sendInvoiceEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { email: customEmail, message: customMessage } = req.body;
        const invoice = await prisma_1.default.invoice.findUnique({
            where: { id },
            include: { customer: true, items: true }
        });
        if (!invoice || invoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }
        const customerEmail = customEmail || invoice.customer?.email;
        if (!customerEmail) {
            return res.status(400).json({
                success: false,
                message: 'Customer email not found. Please provide an email address.'
            });
        }
        const company = await prisma_1.default.company.findUnique({
            where: { id: req.user.companyId }
        });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
        const { generatePDFBuffer } = await Promise.resolve().then(() => __importStar(require('../../services/pdfService')));
        const pdfData = {
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate || undefined,
            customer: {
                name: invoice.customer?.name || 'Customer',
                email: invoice.customer?.email || undefined,
                phone: invoice.customer?.phone || undefined,
                gstNumber: invoice.customer?.gstin || undefined,
            },
            company: {
                businessName: company.businessName,
                legalName: company.legalName || undefined,
                gstin: company.gstin || undefined,
                phone: company.phone || undefined,
                email: company.email || undefined,
                address: company.address
            },
            items: invoice.items.map((item) => ({
                productName: item.productName,
                quantity: Number(item.quantity),
                rate: Number(item.rate),
                gstRate: Number(item.gstRate || 0),
                amount: Number(item.amount || item.quantity * item.rate)
            })),
            subtotal: Number(invoice.subtotal),
            totalAmount: Number(invoice.totalAmount),
            amountPaid: Number(invoice.amountPaid || 0),
            balanceAmount: Number(invoice.balanceAmount || invoice.totalAmount),
            notes: invoice.notes || undefined
        };
        const pdfBuffer = await generatePDFBuffer(pdfData);
        const { sendEmail, generateInvoiceEmailHTML } = await Promise.resolve().then(() => __importStar(require('../../services/emailService')));
        const formatDate = (date) => {
            if (!date)
                return 'N/A';
            return new Date(date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        };
        await sendEmail({
            to: customerEmail,
            subject: `Invoice ${invoice.invoiceNumber} from ${company.businessName}`,
            html: generateInvoiceEmailHTML({
                companyName: company.businessName,
                customerName: invoice.customer?.name || 'Customer',
                invoiceNumber: invoice.invoiceNumber,
                amount: Number(invoice.totalAmount),
                dueDate: formatDate(invoice.dueDate),
                customMessage
            }),
            attachments: [{
                    filename: `${invoice.invoiceNumber}.pdf`,
                    content: pdfBuffer
                }],
            senderEmail: req.user.email,
            senderName: company.businessName
        });
        if (invoice.status === 'DRAFT') {
            await prisma_1.default.invoice.update({
                where: { id },
                data: { status: 'SENT' }
            });
        }
        logger_1.default.info(`Invoice ${invoice.invoiceNumber} sent to ${customerEmail} by ${req.user.email}`);
        return res.status(200).json({
            success: true,
            message: `Invoice sent successfully to ${customerEmail}`
        });
    }
    catch (error) {
        logger_1.default.error('Send invoice email error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error sending invoice email'
        });
    }
};
exports.sendInvoiceEmail = sendInvoiceEmail;
//# sourceMappingURL=invoiceActionsController.js.map