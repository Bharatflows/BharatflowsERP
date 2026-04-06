import { Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { AuthRequest } from '../middleware/auth';
import { getNextNumber, decrementSequence } from '../services/sequenceService';
import { eventBus, EventTypes } from '../services/eventBus';

// @desc    Get all sales orders
// @route   GET /api/v1/sales/orders
// @access  Private
export const getSalesOrders = async (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {
            companyId: req.user.companyId
        };

        if (status) {
            where.status = status.toString().toUpperCase();
        }

        if (search) {
            where.OR = [
                { orderNumber: { contains: search as string } },
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.salesOrder.findMany({
                where,
                include: {
                    customer: true,
                    items: true
                },
                orderBy: { orderDate: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.salesOrder.count({ where })
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
    } catch (error: any) {
        logger.error('Get sales orders error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sales orders',
            error: error.message
        });
    }
};

// @desc    Get single sales order
// @route   GET /api/v1/sales/orders/:id
// @access  Private
export const getSalesOrder = async (req: AuthRequest, res: Response) => {
    try {
        const order = await prisma.salesOrder.findUnique({
            where: {
                id: req.params.id
            , companyId: req.user.companyId },
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
    } catch (error: any) {
        logger.error('Get sales order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching sales order',
            error: error.message
        });
    }
};

// @desc    Create sales order
// @route   POST /api/v1/sales/orders
// @access  Private
export const createSalesOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId, items, orderDate, expectedDate, status, notes } = req.body;
        // Always generate order number on backend for atomicity
        const orderNumber = await getNextNumber(req.user.companyId, 'SALES_ORDER');

        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;

        // Prepare items for Prisma create
        const orderItems = items.map((item: any) => {
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

        const order = await prisma.salesOrder.create({
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

        // Emit domain event
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.SALES_ORDER_CREATED,
            aggregateType: 'SalesOrder',
            aggregateId: order.id,
            payload: order,
            metadata: { userId: req.user.id, source: 'api' }
        });

        // Auto-create a delivery task if expected date is provided
        if (expectedDate && order.status !== 'CANCELLED') {
            try {
                await prisma.activity.create({
                    data: {
                        companyId: req.user.companyId,
                        type: 'TASK',
                        subject: `Delivery: ${orderNumber}`,
                        description: `Scheduled delivery for order ${orderNumber} to ${order.customer?.name}`,
                        date: new Date(expectedDate),
                        priority: 'HIGH',
                        isCompleted: false,
                        partyId: customerId,
                        createdBy: req.user.id
                    }
                });
            } catch (activityError) {
                logger.error('Failed to auto-create delivery task:', activityError);
                // Don't fail the whole order creation if activity fails
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Sales order created successfully',
            data: { order }
        });
    } catch (error: any) {
        logger.error('Create sales order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating sales order',
            error: error.message
        });
    }
};

// @desc    Update sales order
// @route   PUT /api/v1/sales/orders/:id
// @access  Private
export const updateSalesOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, notes, items, orderDate, expectedDate } = req.body;

        const existingOrder = await prisma.salesOrder.findUnique({
            where: { id , companyId: req.user.companyId }
        });

        if (!existingOrder || existingOrder.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Sales order not found'
            });
        }

        let updateData: any = {
            status,
            notes,
            orderDate: orderDate ? new Date(orderDate) : undefined,
            expectedDate: expectedDate ? new Date(expectedDate) : undefined
        };

        if (items) {
            let subtotal = 0;
            let totalTax = 0;

            const newItems = items.map((item: any) => {
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

        const order = await prisma.salesOrder.update({
            where: { id , companyId: req.user.companyId },
            data: updateData,
            include: {
                items: true,
                customer: true
            }
        });

        // Emit domain event
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.SALES_ORDER_UPDATED,
            aggregateType: 'SalesOrder',
            aggregateId: order.id,
            payload: order,
            metadata: { userId: req.user.id, source: 'api' }
        });

        return res.status(200).json({
            success: true,
            message: 'Sales order updated successfully',
            data: { order }
        });
    } catch (error: any) {
        logger.error('Update sales order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating sales order',
            error: error.message
        });
    }
};

// @desc    Delete sales order
// @route   DELETE /api/v1/sales/orders/:id
// @access  Private
// H2: STRICT delete blocking - only DRAFT orders can be deleted
export const deleteSalesOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const existingOrder = await prisma.salesOrder.findUnique({
            where: { id , companyId: req.user.companyId }
        });

        if (!existingOrder || existingOrder.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Sales order not found'
            });
        }

        // H2: Block deletion of non-DRAFT orders
        if (existingOrder.status !== 'DRAFT') {
            return res.status(400).json({
                success: false,
                message: `Cannot delete ${existingOrder.status} sales order. Only DRAFT orders can be deleted. Use CANCEL flow instead.`,
                code: 'INVALID_STATUS_FOR_DELETE'
            });
        }

        await prisma.salesOrder.delete({
            where: { id , companyId: req.user.companyId }
        });

        // Decrement the sequence number to reuse the freed number
        await decrementSequence(req.user.companyId, 'SALES_ORDER');

        // Emit domain event
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.SALES_ORDER_DELETED,
            aggregateType: 'SalesOrder',
            aggregateId: existingOrder.id,
            payload: existingOrder,
            metadata: { userId: req.user.id, source: 'api' }
        });

        logger.info(`[H2] Sales Order ${existingOrder.orderNumber} deleted (status was DRAFT)`);

        return res.status(200).json({
            success: true,
            message: 'Sales order deleted successfully'
        });
    } catch (error: any) {
        logger.error('Delete sales order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting sales order',
            error: error.message
        });
    }
};

// @desc    Convert sales order to invoice
// @route   POST /api/v1/sales/orders/:id/convert
// @access  Private
export const convertSalesOrderToInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const order = await prisma.salesOrder.findUnique({
            where: { id , companyId: req.user.companyId },
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
        const invoiceNumber = await getNextNumber(req.user.companyId, 'INVOICE');

        // Create invoice from order data
        const invoice = await prisma.invoice.create({
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

        // Emit domain event
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.INVOICE_CREATED,
            aggregateType: 'Invoice',
            aggregateId: invoice.id,
            payload: invoice,
            metadata: { userId: req.user.id, source: 'api' }
        });

        // Optionally update order status
        await prisma.salesOrder.update({
            where: { id , companyId: req.user.companyId },
            data: { status: 'CONFIRMED' } // or some other status indicating progress
        });

        return res.status(200).json({
            success: true,
            message: 'Sales order converted to invoice successfully',
            data: { invoice }
        });

    } catch (error: any) {
        logger.error('Convert sales order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error converting sales order',
            error: error.message
        });
    }
};

// @desc    Convert sales order to Delivery Challan
// @route   POST /api/v1/sales/orders/:id/challan
// @access  Private
export const convertSalesOrderToChallan = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const order = await prisma.salesOrder.findUnique({
            where: { id , companyId: req.user.companyId },
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

        // Generate Challan number
        const challanNumber = await getNextNumber(req.user.companyId, 'DELIVERY_CHALLAN');

        // Create DC from order data
        const challan = await prisma.deliveryChallan.create({
            data: {
                companyId: req.user.companyId,
                customerId: order.customerId,
                challanNumber,
                challanDate: new Date(),
                status: 'DRAFT',
                subtotal: order.subtotal,
                totalAmount: order.totalAmount, // DC usually doesn't have tax, but we populate for reference
                notes: `Converted from Sales Order #${order.orderNumber}`,
                salesOrderId: order.id,
                items: {
                    create: order.items.map(item => ({
                        productId: item.productId,
                        productName: item.productName || 'Unknown Product',
                        quantity: item.quantity,
                        rate: item.rate,
                        total: item.total
                    }))
                }
            },
            include: {
                items: true
            }
        });

        // Emit domain event
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.DELIVERY_CHALLAN_CREATED,
            aggregateType: 'DeliveryChallan',
            aggregateId: challan.id,
            payload: challan,
            metadata: { userId: req.user.id, source: 'api' }
        });

        // Update Sales Order relation/status?
        await prisma.salesOrder.update({
            where: { id , companyId: req.user.companyId },
            data: { status: 'CONFIRMED' } // Assuming generating DC confirms the order
        });

        return res.status(200).json({
            success: true,
            message: 'Sales order converted to Delivery Challan successfully',
            data: { challan }
        });

    } catch (error: any) {
        logger.error('Convert sales order to challan error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error converting sales order to challan',
            error: error.message
        });
    }
};
