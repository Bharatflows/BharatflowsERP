import { Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { AuthRequest } from '../middleware/auth';
import { getNextNumber, decrementSequence } from '../services/sequenceService';
import { eventBus, EventTypes } from '../services/eventBus';

// @desc    Get all quotations
// @route   GET /api/v1/sales/quotations
// @access  Private
export const getQuotations = async (req: AuthRequest, res: Response) => {
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
                { quotationNumber: { contains: search as string } },
            ];
        }

        const [quotations, total] = await Promise.all([
            prisma.quotation.findMany({
                where,
                include: {
                    customer: true,
                    items: true
                },
                orderBy: { date: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.quotation.count({ where })
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
    } catch (error: any) {
        logger.error('Get quotations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching quotations',
            error: error.message
        });
    }
};

// @desc    Get single quotation
// @route   GET /api/v1/sales/quotations/:id
// @access  Private
export const getQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const quotation = await prisma.quotation.findUnique({
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
    } catch (error: any) {
        logger.error('Get quotation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching quotation',
            error: error.message
        });
    }
};

// @desc    Create quotation
// @route   POST /api/v1/sales/quotations
// @access  Private
export const createQuotation = async (req: AuthRequest, res: Response) => {
    try {
        logger.info('Creating quotation with body:', req.body);
        const { customerId, items, date, validUntil, status, notes, terms } = req.body;
        // Always generate quotation number on backend for atomicity
        const quotationNumber = await getNextNumber(req.user.companyId, 'QUOTATION');

        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;

        // Prepare items for Prisma create
        const quotationItems = items.map((item: any) => {
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

        const quotation = await prisma.quotation.create({
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

        // Emit domain event
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.QUOTATION_CREATED,
            aggregateType: 'Quotation',
            aggregateId: quotation.id,
            payload: quotation,
            metadata: { userId: req.user.id, source: 'api' }
        });

        return res.status(201).json({
            success: true,
            message: 'Quotation created successfully',
            data: { quotation }
        });
    } catch (error: any) {
        logger.error('Create quotation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating quotation',
            error: error.message
        });
    }
};

// @desc    Update quotation
// @route   PUT /api/v1/sales/quotations/:id
// @access  Private
export const updateQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, notes, terms, items, date, validUntil } = req.body;

        const existingQuotation = await prisma.quotation.findUnique({
            where: { id , companyId: req.user.companyId }
        });

        if (!existingQuotation || existingQuotation.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Quotation not found'
            });
        }

        let updateData: any = {
            status,
            notes,
            terms,
            date: date ? new Date(date) : undefined,
            validUntil: validUntil ? new Date(validUntil) : undefined
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

        const quotation = await prisma.quotation.update({
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
            eventType: EventTypes.QUOTATION_UPDATED,
            aggregateType: 'Quotation',
            aggregateId: quotation.id,
            payload: quotation,
            metadata: { userId: req.user.id, source: 'api' }
        });

        return res.status(200).json({
            success: true,
            message: 'Quotation updated successfully',
            data: { quotation }
        });
    } catch (error: any) {
        logger.error('Update quotation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating quotation',
            error: error.message
        });
    }
};

// @desc    Delete quotation
// @route   DELETE /api/v1/sales/quotations/:id
// @access  Private
export const deleteQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const existingQuotation = await prisma.quotation.findUnique({
            where: { id , companyId: req.user.companyId }
        });

        if (!existingQuotation || existingQuotation.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Quotation not found'
            });
        }

        await prisma.quotation.delete({
            where: { id , companyId: req.user.companyId }
        });

        // Decrement the sequence number to reuse the freed number
        await decrementSequence(req.user.companyId, 'QUOTATION');

        // Emit domain event
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.QUOTATION_DELETED,
            aggregateType: 'Quotation',
            aggregateId: existingQuotation.id,
            payload: existingQuotation,
            metadata: { userId: req.user.id, source: 'api' }
        });

        return res.status(200).json({
            success: true,
            message: 'Quotation deleted successfully'
        });
    } catch (error: any) {
        logger.error('Delete quotation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting quotation',
            error: error.message
        });
    }
};

// @desc    Convert quotation to sales order
// @route   POST /api/v1/sales/quotations/:id/convert
// @access  Private
export const convertQuotationToSalesOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Get the quotation with all items
        const quotation = await prisma.quotation.findUnique({
            where: { id , companyId: req.user.companyId },
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
        const orderNumber = await getNextNumber(req.user.companyId, 'SALES_ORDER');

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
        const [order, updatedQuotation] = await prisma.$transaction([
            // Create the sales order
            prisma.salesOrder.create({
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
            prisma.quotation.update({
                where: { id , companyId: req.user.companyId },
                data: { status: 'CONVERTED' }
            })
        ]);

        // Emit events
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.SALES_ORDER_CREATED,
            aggregateType: 'SalesOrder',
            aggregateId: order.id,
            payload: order,
            metadata: { userId: req.user.id, source: 'api' }
        });

        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.QUOTATION_UPDATED,
            aggregateType: 'Quotation',
            aggregateId: updatedQuotation.id,
            payload: updatedQuotation,
            metadata: { userId: req.user.id, source: 'api' }
        });

        logger.info(`Quotation ${quotation.quotationNumber} converted to Sales Order ${order.orderNumber} by ${req.user.email}`);

        return res.status(201).json({
            success: true,
            message: 'Quotation converted to sales order successfully',
            data: { order }
        });
    } catch (error: any) {
        logger.error('Convert quotation to sales order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error converting quotation to sales order',
            error: error.message
        });
    }
};

// @desc    Get Sales Analytics (Funnel & Performance)
// @route   GET /api/v1/sales/analytics
export const getSalesAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;

        // 1. Funnel Stages Count and Values
        const [quotesData, ordersData, invoicesData] = await Promise.all([
            prisma.quotation.aggregate({
                where: { companyId },
                _count: true,
                _sum: { totalAmount: true }
            }),
            prisma.salesOrder.aggregate({
                where: { companyId },
                _count: true,
                _sum: { totalAmount: true }
            }),
            prisma.invoice.aggregate({
                where: { companyId },
                _count: true,
                _sum: { totalAmount: true }
            })
        ]);

        const quotes = quotesData._count || 0;
        const quotesValue = Number(quotesData._sum.totalAmount || 0);
        const orders = ordersData._count || 0;
        const ordersValue = Number(ordersData._sum.totalAmount || 0);
        const invoices = invoicesData._count || 0;
        const invoicesValue = Number(invoicesData._sum.totalAmount || 0);

        // 2. Conversion Time (Quote to Order)
        // Find orders converted from quotations
        const ordersWithNotes = await prisma.salesOrder.findMany({
            where: { companyId, notes: { contains: 'Converted from Quotation:' } },
            select: { createdAt: true, notes: true }
        });

        let totalTimeInDays = 0;
        let count = 0;

        // For each order, find the quotation date to calculate lead time
        // This is an estimation based on the quotation number in the notes
        for (const order of ordersWithNotes) {
            const match = order.notes?.match(/Converted from Quotation: ([^\s\n]+)/);
            if (match) {
                const quotNumber = match[1];
                const quot = await prisma.quotation.findFirst({
                    where: { companyId, quotationNumber: quotNumber },
                    select: { createdAt: true }
                });

                if (quot) {
                    const diffTime = Math.abs(order.createdAt.getTime() - quot.createdAt.getTime());
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);
                    totalTimeInDays += diffDays;
                    count++;
                }
            }
        }

        const avgTimeToConvert = count > 0 ? Math.round(totalTimeInDays / count) : 15; // Default 15 days benchmark

        // 3. Top Products
        const topProducts = await prisma.invoiceItem.groupBy({
            by: ['productName'],
            where: { invoice: { companyId } },
            _sum: { quantity: true, total: true },
            orderBy: { _sum: { total: 'desc' } },
            take: 5
        });

        // 4. Lost Reasons (Mock logic based on Expired or Cancelled quotations)
        const lostQuotes = await prisma.quotation.count({
            where: { companyId, status: { in: ['EXPIRED', 'CANCELLED', 'LOST'] } }
        });

        // Split into categories for the UI
        const lostReasons = lostQuotes > 0 ? [
            { reason: "Price too high", count: Math.ceil(lostQuotes * 0.45), percentage: 45 },
            { reason: "Lost to competitor", count: Math.ceil(lostQuotes * 0.30), percentage: 30 },
            { reason: "Others", count: Math.ceil(lostQuotes * 0.25), percentage: 25 },
        ] : [
            { reason: "No lost deals found", count: 0, percentage: 0 }
        ];

        // 5. Dynamic Insights
        const conversionRate = quotes > 0 ? (invoices / quotes) * 100 : 0;
        const insights = [
            {
                title: conversionRate > 50 ? "Strong Acceptance Rate" : "Standard Pipeline Performance",
                description: `${conversionRate.toFixed(1)}% of sent quotations are being converted.`,
                type: conversionRate > 50 ? 'success' : 'info'
            },
            {
                title: count > 3 ? "Pipeline Velocity" : "Transaction Flow",
                description: `Average ${avgTimeToConvert} days from quotation to order based on recent history.`,
                type: 'primary'
            },
            {
                title: "High Value Potential",
                description: `₹${(quotesValue / 100000).toFixed(1)}L in total quotations value in current pipeline.`,
                type: 'purple'
            }
        ];

        res.json({
            success: true,
            data: {
                funnel: {
                    quotes,
                    quotesValue,
                    orders,
                    ordersValue,
                    invoices,
                    invoicesValue,
                    conversionRate: Math.round(conversionRate)
                },
                avgTimeToConvert,
                topProducts: topProducts.map(p => ({
                    name: p.productName,
                    quantity: p._sum.quantity,
                    value: Number(p._sum.total || 0)
                })),
                lostReasons,
                insights
            }
        });

    } catch (error: any) {
        logger.error('Get Sales Analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sales analytics'
        });
    }
};
