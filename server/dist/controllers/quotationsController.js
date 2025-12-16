"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertQuotationToSalesOrder = exports.deleteQuotation = exports.updateQuotation = exports.createQuotation = exports.getQuotation = exports.getQuotations = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
const sequenceService_1 = require("../services/sequenceService");
// @desc    Get all quotations
// @route   GET /api/v1/sales/quotations
// @access  Private
const getQuotations = async (req, res) => {
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
                { quotationNumber: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [quotations, total] = await Promise.all([
            prisma_1.default.quotation.findMany({
                where,
                include: {
                    customer: true,
                    items: true
                },
                orderBy: { date: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma_1.default.quotation.count({ where })
        ]);
        return res.status(200).json({
            success: true,
            data: {
                quotations,
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
        logger_1.default.error('Get quotations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching quotations',
            error: error.message
        });
    }
};
exports.getQuotations = getQuotations;
// @desc    Get single quotation
// @route   GET /api/v1/sales/quotations/:id
// @access  Private
const getQuotation = async (req, res) => {
    try {
        const quotation = await prisma_1.default.quotation.findUnique({
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
        if (!quotation || quotation.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Quotation not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: { quotation }
        });
    }
    catch (error) {
        logger_1.default.error('Get quotation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching quotation',
            error: error.message
        });
    }
};
exports.getQuotation = getQuotation;
// @desc    Create quotation
// @route   POST /api/v1/sales/quotations
// @access  Private
const createQuotation = async (req, res) => {
    try {
        logger_1.default.info('Creating quotation with body:', req.body);
        const { customerId, items, date, validUntil, status, notes, terms } = req.body;
        // Always generate quotation number on backend for atomicity
        const quotationNumber = await (0, sequenceService_1.getNextNumber)(req.user.companyId, 'QUOTATION');
        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;
        // Prepare items for Prisma create
        const quotationItems = items.map((item) => {
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
        const quotation = await prisma_1.default.quotation.create({
            data: {
                companyId: req.user.companyId,
                customerId,
                quotationNumber,
                date: new Date(date),
                validUntil: new Date(validUntil),
                status: status || 'DRAFT',
                notes,
                terms,
                subtotal,
                totalTax,
                totalAmount,
                items: {
                    create: quotationItems
                }
            },
            include: {
                items: true,
                customer: true
            }
        });
        return res.status(201).json({
            success: true,
            message: 'Quotation created successfully',
            data: { quotation }
        });
    }
    catch (error) {
        logger_1.default.error('Create quotation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating quotation',
            error: error.message
        });
    }
};
exports.createQuotation = createQuotation;
// @desc    Update quotation
// @route   PUT /api/v1/sales/quotations/:id
// @access  Private
const updateQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, terms, items, date, validUntil } = req.body;
        const existingQuotation = await prisma_1.default.quotation.findUnique({
            where: { id }
        });
        if (!existingQuotation || existingQuotation.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Quotation not found'
            });
        }
        let updateData = {
            status,
            notes,
            terms,
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
        const quotation = await prisma_1.default.quotation.update({
            where: { id },
            data: updateData,
            include: {
                items: true,
                customer: true
            }
        });
        return res.status(200).json({
            success: true,
            message: 'Quotation updated successfully',
            data: { quotation }
        });
    }
    catch (error) {
        logger_1.default.error('Update quotation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating quotation',
            error: error.message
        });
    }
};
exports.updateQuotation = updateQuotation;
// @desc    Delete quotation
// @route   DELETE /api/v1/sales/quotations/:id
// @access  Private
const deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const existingQuotation = await prisma_1.default.quotation.findUnique({
            where: { id }
        });
        if (!existingQuotation || existingQuotation.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Quotation not found'
            });
        }
        await prisma_1.default.quotation.delete({
            where: { id }
        });
        return res.status(200).json({
            success: true,
            message: 'Quotation deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Delete quotation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting quotation',
            error: error.message
        });
    }
};
exports.deleteQuotation = deleteQuotation;
// @desc    Convert quotation to sales order
// @route   POST /api/v1/sales/quotations/:id/convert
// @access  Private
const convertQuotationToSalesOrder = async (req, res) => {
    try {
        const { id } = req.params;
        // Get the quotation with all items
        const quotation = await prisma_1.default.quotation.findUnique({
            where: { id },
            include: {
                items: true
            }
        });
        if (!quotation || quotation.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Quotation not found'
            });
        }
        // Check if already converted
        if (quotation.status === 'CONVERTED') {
            return res.status(400).json({
                success: false,
                message: 'Quotation has already been converted to sales order'
            });
        }
        // Generate sales order number
        const orderNumber = await (0, sequenceService_1.getNextNumber)(req.user.companyId, 'SALES_ORDER');
        // Prepare order items from quotation items
        const orderItems = quotation.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            rate: item.rate,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            total: item.total
        }));
        // Create sales order in a transaction
        const [order, updatedQuotation] = await prisma_1.default.$transaction([
            // Create the sales order
            prisma_1.default.salesOrder.create({
                data: {
                    companyId: req.user.companyId,
                    customerId: quotation.customerId,
                    orderNumber,
                    orderDate: new Date(),
                    status: 'DRAFT',
                    notes: `Converted from Quotation: ${quotation.quotationNumber}\n${quotation.notes || ''}`,
                    subtotal: quotation.subtotal,
                    totalTax: quotation.totalTax,
                    totalAmount: quotation.totalAmount,
                    items: {
                        create: orderItems
                    }
                },
                include: {
                    items: true,
                    customer: true
                }
            }),
            // Update quotation status to CONVERTED
            prisma_1.default.quotation.update({
                where: { id },
                data: { status: 'CONVERTED' }
            })
        ]);
        logger_1.default.info(`Quotation ${quotation.quotationNumber} converted to Sales Order ${order.orderNumber} by ${req.user.email}`);
        return res.status(201).json({
            success: true,
            message: 'Quotation converted to sales order successfully',
            data: { order }
        });
    }
    catch (error) {
        logger_1.default.error('Convert quotation to sales order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error converting quotation to sales order',
            error: error.message
        });
    }
};
exports.convertQuotationToSalesOrder = convertQuotationToSalesOrder;
//# sourceMappingURL=quotationsController.js.map