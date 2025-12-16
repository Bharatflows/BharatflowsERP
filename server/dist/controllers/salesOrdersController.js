"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSalesOrderToInvoice = exports.deleteSalesOrder = exports.updateSalesOrder = exports.createSalesOrder = exports.getSalesOrder = exports.getSalesOrders = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
const sequenceService_1 = require("../services/sequenceService");
// @desc    Get all sales orders
// @route   GET /api/v1/sales/orders
// @access  Private
const getSalesOrders = async (req, res) => {
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
                { orderNumber: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [orders, total] = await Promise.all([
            prisma_1.default.salesOrder.findMany({
                where,
                include: {
                    customer: true,
                    items: true
                },
                orderBy: { orderDate: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma_1.default.salesOrder.count({ where })
        ]);
        return res.status(200).json({
            success: true,
            data: {
                orders,
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
        logger_1.default.error('Get sales orders error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sales orders',
            error: error.message
        });
    }
};
exports.getSalesOrders = getSalesOrders;
// @desc    Get single sales order
// @route   GET /api/v1/sales/orders/:id
// @access  Private
const getSalesOrder = async (req, res) => {
    try {
        const order = await prisma_1.default.salesOrder.findUnique({
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
        if (!order || order.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Sales order not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: { order }
        });
    }
    catch (error) {
        logger_1.default.error('Get sales order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sales order',
            error: error.message
        });
    }
};
exports.getSalesOrder = getSalesOrder;
// @desc    Create sales order
// @route   POST /api/v1/sales/orders
// @access  Private
const createSalesOrder = async (req, res) => {
    try {
        const { customerId, items, orderDate, expectedDate, status, notes } = req.body;
        // Always generate order number on backend for atomicity
        const orderNumber = await (0, sequenceService_1.getNextNumber)(req.user.companyId, 'SALES_ORDER');
        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;
        // Prepare items for Prisma create
        const orderItems = items.map((item) => {
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
        const order = await prisma_1.default.salesOrder.create({
            data: {
                companyId: req.user.companyId,
                customerId,
                orderNumber,
                orderDate: new Date(orderDate),
                expectedDate: expectedDate ? new Date(expectedDate) : null,
                status: status || 'DRAFT',
                notes,
                subtotal,
                totalTax,
                totalAmount,
                items: {
                    create: orderItems
                }
            },
            include: {
                items: true,
                customer: true
            }
        });
        return res.status(201).json({
            success: true,
            message: 'Sales order created successfully',
            data: { order }
        });
    }
    catch (error) {
        logger_1.default.error('Create sales order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating sales order',
            error: error.message
        });
    }
};
exports.createSalesOrder = createSalesOrder;
// @desc    Update sales order
// @route   PUT /api/v1/sales/orders/:id
// @access  Private
const updateSalesOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, items, orderDate, expectedDate } = req.body;
        const existingOrder = await prisma_1.default.salesOrder.findUnique({
            where: { id }
        });
        if (!existingOrder || existingOrder.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Sales order not found'
            });
        }
        let updateData = {
            status,
            notes,
            orderDate: orderDate ? new Date(orderDate) : undefined,
            expectedDate: expectedDate ? new Date(expectedDate) : undefined
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
        const order = await prisma_1.default.salesOrder.update({
            where: { id },
            data: updateData,
            include: {
                items: true,
                customer: true
            }
        });
        return res.status(200).json({
            success: true,
            message: 'Sales order updated successfully',
            data: { order }
        });
    }
    catch (error) {
        logger_1.default.error('Update sales order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating sales order',
            error: error.message
        });
    }
};
exports.updateSalesOrder = updateSalesOrder;
// @desc    Delete sales order
// @route   DELETE /api/v1/sales/orders/:id
// @access  Private
const deleteSalesOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const existingOrder = await prisma_1.default.salesOrder.findUnique({
            where: { id }
        });
        if (!existingOrder || existingOrder.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Sales order not found'
            });
        }
        await prisma_1.default.salesOrder.delete({
            where: { id }
        });
        return res.status(200).json({
            success: true,
            message: 'Sales order deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Delete sales order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting sales order',
            error: error.message
        });
    }
};
exports.deleteSalesOrder = deleteSalesOrder;
// @desc    Convert sales order to invoice
// @route   POST /api/v1/sales/orders/:id/convert
// @access  Private
const convertSalesOrderToInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma_1.default.salesOrder.findUnique({
            where: { id },
            include: {
                items: true
            }
        });
        if (!order || order.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Sales order not found'
            });
        }
        // Check if already converted or fully fulfilled?
        // For now, just allow conversion.
        // Generate invoice number
        const invoiceNumber = await (0, sequenceService_1.getNextNumber)(req.user.companyId, 'INVOICE');
        // Create invoice from order data
        const invoice = await prisma_1.default.invoice.create({
            data: {
                companyId: req.user.companyId,
                userId: req.user.id,
                customerId: order.customerId,
                invoiceNumber,
                invoiceDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Net 30
                status: 'DRAFT',
                subtotal: order.subtotal,
                totalTax: order.totalTax,
                totalAmount: order.totalAmount,
                balanceAmount: order.totalAmount,
                notes: `Converted from Sales Order #${order.orderNumber}`,
                items: {
                    create: order.items.map(item => ({
                        productId: item.productId,
                        productName: item.productName || 'Unknown Product',
                        quantity: item.quantity,
                        rate: item.rate,
                        taxRate: item.taxRate,
                        taxAmount: item.taxAmount,
                        total: item.total
                    }))
                }
            },
            include: {
                items: true
            }
        });
        // Optionally update order status
        await prisma_1.default.salesOrder.update({
            where: { id },
            data: { status: 'CONFIRMED' } // or some other status indicating progress
        });
        return res.status(200).json({
            success: true,
            message: 'Sales order converted to invoice successfully',
            data: { invoice }
        });
    }
    catch (error) {
        logger_1.default.error('Convert sales order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error converting sales order',
            error: error.message
        });
    }
};
exports.convertSalesOrderToInvoice = convertSalesOrderToInvoice;
//# sourceMappingURL=salesOrdersController.js.map