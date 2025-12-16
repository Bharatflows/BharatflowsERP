"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentSummary = exports.deleteGSTPayment = exports.updateGSTPayment = exports.createGSTPayment = exports.getGSTPayment = exports.getGSTPayments = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../config/logger"));
// @desc    Get all GST Payments
// @route   GET /api/v1/gst/payments
// @access  Private
const getGSTPayments = async (req, res) => {
    try {
        const { status, period, page = 1, limit = 20 } = req.query;
        const companyId = req.user.companyId;
        const where = { companyId };
        if (status)
            where.status = status;
        if (period)
            where.period = period;
        const skip = (Number(page) - 1) * Number(limit);
        const [payments, total] = await Promise.all([
            prisma_1.default.gSTPayment.findMany({
                where,
                orderBy: { date: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma_1.default.gSTPayment.count({ where }),
        ]);
        return res.json({
            success: true,
            data: {
                items: payments,
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
        logger_1.default.error('Get GST payments error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch GST payments',
            error: error.message,
        });
    }
};
exports.getGSTPayments = getGSTPayments;
// @desc    Get single GST Payment
// @route   GET /api/v1/gst/payments/:id
// @access  Private
const getGSTPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const payment = await prisma_1.default.gSTPayment.findFirst({
            where: { id, companyId },
        });
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'GST Payment not found',
            });
        }
        return res.json({
            success: true,
            data: payment,
        });
    }
    catch (error) {
        logger_1.default.error('Get GST payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch GST payment',
            error: error.message,
        });
    }
};
exports.getGSTPayment = getGSTPayment;
// @desc    Create GST Payment
// @route   POST /api/v1/gst/payments
// @access  Private
const createGSTPayment = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { challanNumber, date, period, cgst, sgst, igst = 0, cess = 0, interest = 0, lateFee = 0, penalty = 0, paymentMode, transactionId, } = req.body;
        // Calculate total
        const total = Number(cgst) + Number(sgst) + Number(igst) + Number(cess) +
            Number(interest) + Number(lateFee) + Number(penalty);
        const payment = await prisma_1.default.gSTPayment.create({
            data: {
                challanNumber,
                date: new Date(date),
                period,
                cgst: Number(cgst),
                sgst: Number(sgst),
                igst: Number(igst),
                cess: Number(cess),
                interest: Number(interest),
                lateFee: Number(lateFee),
                penalty: Number(penalty),
                total,
                status: 'pending',
                paymentMode,
                transactionId,
                companyId,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'GST Payment created successfully',
            data: payment,
        });
    }
    catch (error) {
        logger_1.default.error('Create GST payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create GST payment',
            error: error.message,
        });
    }
};
exports.createGSTPayment = createGSTPayment;
// @desc    Update GST Payment
// @route   PUT /api/v1/gst/payments/:id
// @access  Private
const updateGSTPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const updateData = req.body;
        // Check if payment exists
        const existing = await prisma_1.default.gSTPayment.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'GST Payment not found',
            });
        }
        // Recalculate total if any component changes
        if (updateData.cgst || updateData.sgst || updateData.igst || updateData.cess ||
            updateData.interest || updateData.lateFee || updateData.penalty) {
            updateData.total =
                Number(updateData.cgst ?? existing.cgst) +
                    Number(updateData.sgst ?? existing.sgst) +
                    Number(updateData.igst ?? existing.igst) +
                    Number(updateData.cess ?? existing.cess) +
                    Number(updateData.interest ?? existing.interest) +
                    Number(updateData.lateFee ?? existing.lateFee) +
                    Number(updateData.penalty ?? existing.penalty);
        }
        if (updateData.date) {
            updateData.date = new Date(updateData.date);
        }
        const payment = await prisma_1.default.gSTPayment.update({
            where: { id },
            data: updateData,
        });
        return res.json({
            success: true,
            message: 'GST Payment updated successfully',
            data: payment,
        });
    }
    catch (error) {
        logger_1.default.error('Update GST payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update GST payment',
            error: error.message,
        });
    }
};
exports.updateGSTPayment = updateGSTPayment;
// @desc    Delete GST Payment
// @route   DELETE /api/v1/gst/payments/:id
// @access  Private
const deleteGSTPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const existing = await prisma_1.default.gSTPayment.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'GST Payment not found',
            });
        }
        await prisma_1.default.gSTPayment.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: 'GST Payment deleted successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Delete GST payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete GST payment',
            error: error.message,
        });
    }
};
exports.deleteGSTPayment = deleteGSTPayment;
// @desc    Get GST Payment Summary
// @route   GET /api/v1/gst/payments/summary
// @access  Private
const getPaymentSummary = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { year } = req.query;
        const startDate = year
            ? new Date(`${year}-04-01`)
            : new Date(new Date().getFullYear(), 3, 1); // April 1st of current FY
        const endDate = year
            ? new Date(`${Number(year) + 1}-03-31`)
            : new Date(new Date().getFullYear() + 1, 2, 31); // March 31st
        const payments = await prisma_1.default.gSTPayment.findMany({
            where: {
                companyId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        const summary = {
            totalPayments: payments.length,
            totalCGST: payments.reduce((sum, p) => sum + Number(p.cgst), 0),
            totalSGST: payments.reduce((sum, p) => sum + Number(p.sgst), 0),
            totalIGST: payments.reduce((sum, p) => sum + Number(p.igst), 0),
            totalCess: payments.reduce((sum, p) => sum + Number(p.cess), 0),
            totalInterest: payments.reduce((sum, p) => sum + Number(p.interest), 0),
            totalLateFee: payments.reduce((sum, p) => sum + Number(p.lateFee), 0),
            totalPenalty: payments.reduce((sum, p) => sum + Number(p.penalty), 0),
            grandTotal: payments.reduce((sum, p) => sum + Number(p.total), 0),
            successfulPayments: payments.filter(p => p.status === 'success').length,
            pendingPayments: payments.filter(p => p.status === 'pending').length,
            failedPayments: payments.filter(p => p.status === 'failed').length,
        };
        return res.json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        logger_1.default.error('Get payment summary error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch payment summary',
            error: error.message,
        });
    }
};
exports.getPaymentSummary = getPaymentSummary;
//# sourceMappingURL=gstPaymentsController.js.map