"use strict";
/**
 * Invoice Controller
 *
 * Handles core invoice CRUD operations.
 * Split from salesController.ts for better maintainability.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchInvoices = exports.deleteInvoice = exports.updateInvoice = exports.createInvoice = exports.getInvoice = exports.getInvoices = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../config/logger"));
const sequenceService_1 = require("../../services/sequenceService");
// @desc    Get all invoices
// @route   GET /api/v1/sales/invoices
// @access  Private
const getInvoices = async (req, res) => {
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
                { invoiceNumber: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [invoices, total] = await Promise.all([
            prisma_1.default.invoice.findMany({
                where,
                include: {
                    customer: true,
                    items: true
                },
                orderBy: { invoiceDate: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma_1.default.invoice.count({ where })
        ]);
        return res.status(200).json({
            success: true,
            data: {
                invoices,
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
        logger_1.default.error('Get invoices error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching invoices',
            error: error.message
        });
    }
};
exports.getInvoices = getInvoices;
// @desc    Get single invoice
// @route   GET /api/v1/sales/invoices/:id
// @access  Private
const getInvoice = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findUnique({
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
        if (!invoice || invoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: { invoice }
        });
    }
    catch (error) {
        logger_1.default.error('Get invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching invoice',
            error: error.message
        });
    }
};
exports.getInvoice = getInvoice;
// @desc    Create invoice
// @route   POST /api/v1/sales/invoices
// @access  Private
const createInvoice = async (req, res) => {
    try {
        const { customerId, items, invoiceDate, dueDate, status, notes } = req.body;
        const invoiceNumber = await (0, sequenceService_1.getNextNumber)(req.user.companyId, 'INVOICE');
        let subtotal = 0;
        let totalTax = 0;
        const invoiceItems = items.map((item) => {
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
        const result = await prisma_1.default.$transaction(async (tx) => {
            const invoice = await tx.invoice.create({
                data: {
                    companyId: req.user.companyId,
                    userId: req.user.id,
                    customerId,
                    invoiceNumber,
                    invoiceDate: new Date(invoiceDate),
                    dueDate: dueDate ? new Date(dueDate) : null,
                    status: status || 'DRAFT',
                    notes,
                    subtotal,
                    totalTax,
                    totalAmount,
                    balanceAmount: totalAmount,
                    items: {
                        create: invoiceItems
                    }
                },
                include: {
                    items: true,
                    customer: true
                }
            });
            // Deduct stock for each product
            for (const item of items) {
                if (item.productId) {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { currentStock: true, trackInventory: true }
                    });
                    if (product && product.trackInventory) {
                        const previousStock = product.currentStock;
                        const quantity = Number(item.quantity);
                        const newStock = previousStock - quantity;
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { currentStock: newStock }
                        });
                        await tx.stockMovement.create({
                            data: {
                                companyId: req.user.companyId,
                                productId: item.productId,
                                type: 'SALE',
                                quantity: -quantity,
                                previousStock,
                                newStock,
                                reference: invoiceNumber,
                                reason: `Sold via Invoice ${invoiceNumber}`,
                                createdBy: req.user.id
                            }
                        });
                    }
                }
            }
            // Update customer balance
            await tx.party.update({
                where: { id: customerId },
                data: {
                    currentBalance: {
                        increment: totalAmount
                    }
                }
            });
            return invoice;
        });
        logger_1.default.info(`Invoice created: ${result.invoiceNumber} by ${req.user.email}`);
        return res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            data: { invoice: result }
        });
    }
    catch (error) {
        logger_1.default.error('Create invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating invoice',
            error: error.message
        });
    }
};
exports.createInvoice = createInvoice;
// @desc    Update invoice
// @route   PUT /api/v1/sales/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, items } = req.body;
        const existingInvoice = await prisma_1.default.invoice.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!existingInvoice || existingInvoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }
        let updateData = { status, notes };
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
        const invoice = await prisma_1.default.invoice.update({
            where: { id },
            data: updateData,
            include: {
                items: true,
                customer: true
            }
        });
        logger_1.default.info(`Invoice updated: ${invoice.invoiceNumber} by ${req.user.email}`);
        return res.status(200).json({
            success: true,
            message: 'Invoice updated successfully',
            data: { invoice }
        });
    }
    catch (error) {
        logger_1.default.error('Update invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating invoice',
            error: error.message
        });
    }
};
exports.updateInvoice = updateInvoice;
// @desc    Delete invoice
// @route   DELETE /api/v1/sales/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const existingInvoice = await prisma_1.default.invoice.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!existingInvoice || existingInvoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }
        await prisma_1.default.$transaction(async (tx) => {
            // Restore stock for each product
            for (const item of existingInvoice.items) {
                if (item.productId) {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { currentStock: true, trackInventory: true }
                    });
                    if (product && product.trackInventory) {
                        const previousStock = product.currentStock;
                        const quantity = item.quantity;
                        const newStock = previousStock + quantity;
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { currentStock: newStock }
                        });
                        await tx.stockMovement.create({
                            data: {
                                companyId: req.user.companyId,
                                productId: item.productId,
                                type: 'ADJUSTMENT',
                                quantity: quantity,
                                previousStock,
                                newStock,
                                reference: existingInvoice.invoiceNumber,
                                reason: `Stock restored - Invoice ${existingInvoice.invoiceNumber} deleted`,
                                createdBy: req.user.id
                            }
                        });
                    }
                }
            }
            // Reduce customer balance
            await tx.party.update({
                where: { id: existingInvoice.customerId },
                data: {
                    currentBalance: {
                        decrement: Number(existingInvoice.totalAmount)
                    }
                }
            });
            await tx.invoice.delete({
                where: { id }
            });
        });
        logger_1.default.info(`Invoice deleted: ${existingInvoice.invoiceNumber} by ${req.user.email}`);
        return res.status(200).json({
            success: true,
            message: 'Invoice deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Delete invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting invoice',
            error: error.message
        });
    }
};
exports.deleteInvoice = deleteInvoice;
// @desc    Search invoices
// @route   GET /api/v1/sales/invoices/search
// @access  Private
const searchInvoices = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }
        const invoices = await prisma_1.default.invoice.findMany({
            where: {
                companyId: req.user.companyId,
                OR: [
                    { invoiceNumber: { contains: q, mode: 'insensitive' } },
                ]
            },
            take: 10,
            orderBy: { invoiceDate: 'desc' },
            include: { customer: true }
        });
        return res.status(200).json({
            success: true,
            data: { invoices }
        });
    }
    catch (error) {
        logger_1.default.error('Search invoices error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error searching invoices',
            error: error.message
        });
    }
};
exports.searchInvoices = searchInvoices;
//# sourceMappingURL=invoiceController.js.map