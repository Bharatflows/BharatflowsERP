"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEInvoice = exports.cancelEInvoice = exports.updateEInvoiceStatus = exports.generateEInvoice = exports.getEInvoice = exports.getEInvoices = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../config/logger"));
const eInvoiceService_1 = require("../../services/gst/eInvoiceService");
// @desc    Get all E-Invoices
// @route   GET /api/v1/gst/e-invoices
// @access  Private
const getEInvoices = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const companyId = req.user.companyId;
        const where = { companyId };
        if (status)
            where.status = status;
        const skip = (Number(page) - 1) * Number(limit);
        const [eInvoices, total] = await Promise.all([
            prisma_1.default.eInvoice.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma_1.default.eInvoice.count({ where }),
        ]);
        return res.json({
            success: true,
            data: {
                items: eInvoices,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get E-Invoices error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch E-Invoices',
            error: error.message,
        });
    }
};
exports.getEInvoices = getEInvoices;
// @desc    Get single E-Invoice
// @route   GET /api/v1/gst/e-invoices/:id
// @access  Private
const getEInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const eInvoice = await prisma_1.default.eInvoice.findFirst({
            where: { id, companyId },
        });
        if (!eInvoice) {
            return res.status(404).json({
                success: false,
                message: 'E-Invoice not found',
            });
        }
        return res.json({
            success: true,
            data: eInvoice,
        });
    }
    catch (error) {
        logger_1.default.error('Get E-Invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch E-Invoice',
            error: error.message,
        });
    }
};
exports.getEInvoice = getEInvoice;
// @desc    Generate E-Invoice for an invoice
// @route   POST /api/v1/gst/e-invoices/generate
// @access  Private
// @desc    Generate E-Invoice for an invoice
// @route   POST /api/v1/gst/e-invoices/generate
// @access  Private
const generateEInvoice = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { invoiceId } = req.body;
        // Fetch the invoice to ensure it exists
        const invoice = await prisma_1.default.invoice.findFirst({
            where: { id: invoiceId, companyId },
            include: { customer: true },
        });
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
            });
        }
        // Check if E-Invoice already exists
        const existing = await prisma_1.default.eInvoice.findFirst({
            where: { invoiceId, companyId },
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'E-Invoice already generated for this invoice',
                data: existing,
            });
        }
        // 1. Generate Compliance Payload
        const payload = await eInvoiceService_1.GSTEInvoiceService.generatePayload(invoiceId, companyId);
        // 2. Validate and Mock Submit
        const irnResponse = await eInvoiceService_1.GSTEInvoiceService.validateAndMockSubmit(payload);
        // 3. Save to DB
        // @ts-ignore - jsonPayload might be missing if migration failed
        const eInvoice = await prisma_1.default.eInvoice.create({
            data: {
                invoiceId,
                invoiceNumber: invoice.invoiceNumber,
                invoiceDate: invoice.invoiceDate,
                status: 'generated', // Successfully generated
                customerName: invoice.customer?.name || 'Unknown',
                gstin: invoice.customer?.gstin || null,
                invoiceValue: invoice.totalAmount,
                companyId,
                irn: irnResponse.Irn,
                ackNumber: irnResponse.AckNo,
                ackDate: new Date(irnResponse.AckDt),
                signedQR: irnResponse.SignedQRCode,
                signedInvoice: irnResponse.SignedInvoice,
                jsonPayload: payload // Store valid JSON
            },
        });
        return res.status(201).json({
            success: true,
            message: 'E-Invoice generated successfully',
            data: eInvoice,
        });
    }
    catch (error) {
        logger_1.default.error('Generate E-Invoice error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate E-Invoice',
            error: error.message,
        });
    }
};
exports.generateEInvoice = generateEInvoice;
// @desc    Update E-Invoice status (simulate IRN generation)
// @route   PUT /api/v1/gst/e-invoices/:id/status
// @access  Private
const updateEInvoiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const { status, irn, ackNumber, ackDate, signedQR, errorMessage } = req.body;
        const existing = await prisma_1.default.eInvoice.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'E-Invoice not found',
            });
        }
        const updateData = { status };
        if (irn)
            updateData.irn = irn;
        if (ackNumber)
            updateData.ackNumber = ackNumber;
        if (ackDate)
            updateData.ackDate = new Date(ackDate);
        if (signedQR)
            updateData.signedQR = signedQR;
        if (errorMessage)
            updateData.errorMessage = errorMessage;
        const eInvoice = await prisma_1.default.eInvoice.update({
            where: { id },
            data: updateData,
        });
        return res.json({
            success: true,
            message: 'E-Invoice status updated',
            data: eInvoice,
        });
    }
    catch (error) {
        logger_1.default.error('Update E-Invoice status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update E-Invoice status',
            error: error.message,
        });
    }
};
exports.updateEInvoiceStatus = updateEInvoiceStatus;
// @desc    Cancel E-Invoice
// @route   POST /api/v1/gst/e-invoices/:id/cancel
// @access  Private
const cancelEInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const { reason } = req.body;
        const existing = await prisma_1.default.eInvoice.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'E-Invoice not found',
            });
        }
        if (existing.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'E-Invoice is already cancelled',
            });
        }
        // In production, this would call the NIC API to cancel
        const eInvoice = await prisma_1.default.eInvoice.update({
            where: { id },
            data: {
                status: 'cancelled',
                errorMessage: reason || 'Cancelled by user',
            },
        });
        return res.json({
            success: true,
            message: 'E-Invoice cancelled successfully',
            data: eInvoice,
        });
    }
    catch (error) {
        logger_1.default.error('Cancel E-Invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to cancel E-Invoice',
            error: error.message,
        });
    }
};
exports.cancelEInvoice = cancelEInvoice;
// @desc    Delete E-Invoice (only pending ones)
// @route   DELETE /api/v1/gst/e-invoices/:id
// @access  Private
const deleteEInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const existing = await prisma_1.default.eInvoice.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'E-Invoice not found',
            });
        }
        if (existing.status === 'generated' && existing.irn) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete a generated E-Invoice. Use cancel instead.',
            });
        }
        await prisma_1.default.eInvoice.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: 'E-Invoice deleted successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Delete E-Invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete E-Invoice',
            error: error.message,
        });
    }
};
exports.deleteEInvoice = deleteEInvoice;
//# sourceMappingURL=eInvoiceController.js.map