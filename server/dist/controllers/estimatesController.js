"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertEstimateToInvoice = exports.deleteEstimate = exports.updateEstimate = exports.createEstimate = exports.getEstimate = exports.getEstimates = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
const sequenceService_1 = require("../services/sequenceService");
const eventBus_1 = require("../services/eventBus");
// @desc    Get all estimates
// @route   GET /api/v1/sales/estimates
// @access  Private
const getEstimates = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
            companyId: req.user.companyId
        };
        if (status) {
            where.status = status.toString().toUpperCase();
        }
        if (search) {
            where.OR = [
                { estimateNumber: { contains: search } },
            ];
        }
        const [estimates, total] = await Promise.all([
            prisma_1.default.estimate.findMany({
                where,
                include: {
                    customer: true,
                    items: true
                },
                orderBy: { date: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma_1.default.estimate.count({ where })
        ]);
        return res.status(200).json({
            success: true,
            data: {
                estimates,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Get estimates error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching estimates',
            error: error.message
        });
    }
};
exports.getEstimates = getEstimates;
// @desc    Get single estimate
// @route   GET /api/v1/sales/estimates/:id
// @access  Private
const getEstimate = async (req, res) => {
    try {
        const estimate = await prisma_1.default.estimate.findUnique({
            where: {
                id: req.params.id
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
        if (!estimate || estimate.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Estimate not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: { estimate }
        });
    }
    catch (error) {
        logger_1.default.error('Get estimate error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching estimate',
            error: error.message
        });
    }
};
exports.getEstimate = getEstimate;
// @desc    Create estimate
// @route   POST /api/v1/sales/estimates
// @access  Private
const createEstimate = async (req, res) => {
    try {
        const { customerId, items, date, validUntil, status, notes } = req.body;
        // Always generate estimate number on backend for atomicity
        const estimateNumber = await (0, sequenceService_1.getNextNumber)(req.user.companyId, 'ESTIMATE');
        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;
        // Prepare items for Prisma create
        const estimateItems = items.map((item) => {
            const total = Number(item.quantity) * Number(item.rate);
            const tax = total * (Number(item.taxRate) / 100);
            subtotal += total;
            totalTax += tax;
            return {
                productId: item.productId,
                productName: item.productName || 'Unknown Product',
                quantity: Number(item.quantity),
                rate: Number(item.rate),
                taxRate: Number(item.taxRate),
                taxAmount: tax,
                total: total + tax
            };
        });
        const totalAmount = subtotal + totalTax;
        const estimate = await prisma_1.default.estimate.create({
            data: {
                companyId: req.user.companyId,
                customerId,
                estimateNumber,
                date: new Date(date),
                validUntil: new Date(validUntil),
                status: status || 'PENDING',
                notes,
                subtotal,
                totalTax,
                totalAmount,
                items: {
                    create: estimateItems
                }
            },
            include: {
                items: true,
                customer: true
            }
        });
        // Emit domain event
        await eventBus_1.eventBus.emit({
            companyId: req.user.companyId,
            eventType: eventBus_1.EventTypes.ESTIMATE_CREATED,
            aggregateType: 'Estimate',
            aggregateId: estimate.id,
            payload: estimate,
            metadata: { userId: req.user.id, source: 'api' }
        });
        return res.status(201).json({
            success: true,
            message: 'Estimate created successfully',
            data: { estimate }
        });
    }
    catch (error) {
        logger_1.default.error('Create estimate error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating estimate',
            error: error.message
        });
    }
};
exports.createEstimate = createEstimate;
// @desc    Update estimate
// @route   PUT /api/v1/sales/estimates/:id
// @access  Private
const updateEstimate = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, items, date, validUntil } = req.body;
        const existingEstimate = await prisma_1.default.estimate.findUnique({
            where: { id }
        });
        if (!existingEstimate || existingEstimate.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Estimate not found'
            });
        }
        let updateData = {
            status,
            notes,
            date: date ? new Date(date) : undefined,
            validUntil: validUntil ? new Date(validUntil) : undefined
        };
        if (items) {
            let subtotal = 0;
            let totalTax = 0;
            const newItems = items.map((item) => {
                const total = Number(item.quantity) * Number(item.rate);
                const tax = total * (Number(item.taxRate) / 100);
                subtotal += total;
                totalTax += tax;
                return {
                    productId: item.productId,
                    productName: item.productName || 'Unknown Product',
                    quantity: Number(item.quantity),
                    rate: Number(item.rate),
                    taxRate: Number(item.taxRate),
                    taxAmount: tax,
                    total: total + tax
                };
            });
            const totalAmount = subtotal + totalTax;
            updateData = {
                ...updateData,
                subtotal,
                totalTax,
                totalAmount,
                items: {
                    deleteMany: {},
                    create: newItems
                }
            };
        }
        const estimate = await prisma_1.default.estimate.update({
            where: { id },
            data: updateData,
            include: {
                items: true,
                customer: true
            }
        });
        // Emit domain event
        await eventBus_1.eventBus.emit({
            companyId: req.user.companyId,
            eventType: eventBus_1.EventTypes.ESTIMATE_UPDATED,
            aggregateType: 'Estimate',
            aggregateId: estimate.id,
            payload: estimate,
            metadata: { userId: req.user.id, source: 'api' }
        });
        return res.status(200).json({
            success: true,
            message: 'Estimate updated successfully',
            data: { estimate }
        });
    }
    catch (error) {
        logger_1.default.error('Update estimate error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating estimate',
            error: error.message
        });
    }
};
exports.updateEstimate = updateEstimate;
// @desc    Delete estimate
// @route   DELETE /api/v1/sales/estimates/:id
// @access  Private
const deleteEstimate = async (req, res) => {
    try {
        const { id } = req.params;
        const existingEstimate = await prisma_1.default.estimate.findUnique({
            where: { id }
        });
        if (!existingEstimate || existingEstimate.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Estimate not found'
            });
        }
        await prisma_1.default.estimate.delete({
            where: { id }
        });
        // Decrement the sequence number to reuse the freed number
        await (0, sequenceService_1.decrementSequence)(req.user.companyId, 'ESTIMATE');
        return res.status(200).json({
            success: true,
            message: 'Estimate deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Delete estimate error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting estimate',
            error: error.message
        });
    }
};
exports.deleteEstimate = deleteEstimate;
// @desc    Convert estimate to invoice
// @route   POST /api/v1/sales/estimates/:id/convert
// @access  Private
const convertEstimateToInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        // Get the estimate with all items
        const estimate = await prisma_1.default.estimate.findUnique({
            where: { id },
            include: {
                items: true
            }
        });
        if (!estimate || estimate.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Estimate not found'
            });
        }
        // Check if already converted
        if (estimate.status === 'CONVERTED') {
            return res.status(400).json({
                success: false,
                message: 'Estimate has already been converted to invoice'
            });
        }
        // Generate invoice number
        const invoiceNumber = await (0, sequenceService_1.getNextNumber)(req.user.companyId, 'INVOICE');
        // Prepare invoice items from estimate items
        const invoiceItems = estimate.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            rate: item.rate,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            total: item.total
        }));
        // Create invoice in a transaction
        const [invoice, updatedEstimate] = await prisma_1.default.$transaction([
            // Create the invoice
            prisma_1.default.invoice.create({
                data: {
                    companyId: req.user.companyId,
                    userId: req.user.id,
                    customerId: estimate.customerId,
                    invoiceNumber,
                    invoiceDate: new Date(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                    status: 'DRAFT',
                    notes: `Converted from Estimate: ${estimate.estimateNumber}\n${estimate.notes || ''}`,
                    subtotal: estimate.subtotal,
                    totalTax: estimate.totalTax,
                    totalAmount: estimate.totalAmount,
                    balanceAmount: estimate.totalAmount,
                    items: {
                        create: invoiceItems
                    }
                },
                include: {
                    items: true,
                    customer: true
                }
            }),
            // Update estimate status to CONVERTED
            prisma_1.default.estimate.update({
                where: { id },
                data: { status: 'CONVERTED' }
            })
        ]);
        logger_1.default.info(`Estimate ${estimate.estimateNumber} converted to Invoice ${invoice.invoiceNumber} by ${req.user.email}`);
        // Emit INVOICE_CREATED event
        await eventBus_1.eventBus.emit({
            companyId: req.user.companyId,
            eventType: eventBus_1.EventTypes.INVOICE_CREATED,
            aggregateType: 'Invoice',
            aggregateId: invoice.id,
            payload: invoice,
            metadata: { userId: req.user.id, source: 'api' }
        });
        // Emit ESTIMATE_UPDATED event (status change)
        await eventBus_1.eventBus.emit({
            companyId: req.user.companyId,
            eventType: eventBus_1.EventTypes.ESTIMATE_UPDATED,
            aggregateType: 'Estimate',
            aggregateId: updatedEstimate.id,
            payload: updatedEstimate,
            metadata: { userId: req.user.id, source: 'api' }
        });
        return res.status(201).json({
            success: true,
            message: 'Estimate converted to invoice successfully',
            data: { invoice }
        });
    }
    catch (error) {
        logger_1.default.error('Convert estimate to invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error converting estimate to invoice',
            error: error.message
        });
    }
};
exports.convertEstimateToInvoice = convertEstimateToInvoice;
//# sourceMappingURL=estimatesController.js.map