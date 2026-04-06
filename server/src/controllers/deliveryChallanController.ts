import { Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { AuthRequest } from '../middleware/auth';
import { getNextNumber, decrementSequence } from '../services/sequenceService';
import { eventBus, EventTypes } from '../services/eventBus';

// @desc    Get all delivery challans
// @route   GET /api/v1/sales/challans
// @access  Private
export const getDeliveryChallans = async (req: AuthRequest, res: Response) => {
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
                { challanNumber: { contains: search as string } },
            ];
        }

        const [challans, total] = await Promise.all([
            prisma.deliveryChallan.findMany({
                where,
                include: {
                    customer: true,
                    items: true
                },
                orderBy: { challanDate: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.deliveryChallan.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                challans,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error: any) {
        logger.error('Get delivery challans error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching delivery challans',
            error: error.message
        });
    }
};

// @desc    Get single delivery challan
// @route   GET /api/v1/sales/challans/:id
// @access  Private
export const getDeliveryChallan = async (req: AuthRequest, res: Response) => {
    try {
        const challan = await prisma.deliveryChallan.findUnique({
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

        if (!challan || challan.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Delivery challan not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: { challan }
        });
    } catch (error: any) {
        logger.error('Get delivery challan error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching delivery challan',
            error: error.message
        });
    }
};

// @desc    Create new delivery challan
// @route   POST /api/v1/sales/challans
// @access  Private
export const createDeliveryChallan = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId, challanDate, referenceNumber, items, notes, status } = req.body;

        if (!customerId || !challanDate || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Customer, challan date, and at least one item are required'
            });
        }

        // Calculate totals
        let subtotal = 0;
        const processedItems = items.map((item: any) => {
            const itemTotal = Number(item.quantity) * Number(item.rate);
            subtotal += itemTotal;
            return {
                productId: item.productId,
                productName: item.productName,
                quantity: Number(item.quantity),
                rate: Number(item.rate),
                total: itemTotal
            };
        });

        const totalAmount = subtotal;

        // Generate challan number
        const challanNumber = await getNextNumber(req.user.companyId, 'DELIVERY_CHALLAN');

        const challan = await prisma.deliveryChallan.create({
            data: {
                challanNumber,
                challanDate: new Date(challanDate),
                referenceNumber: referenceNumber || null,
                subtotal,
                totalAmount,
                status: status || 'DRAFT',
                notes: notes || null,
                companyId: req.user.companyId,
                customerId,
                items: {
                    create: processedItems
                }
            },
            include: {
                customer: true,
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

        logger.info(`Delivery challan created: ${challan.challanNumber} by user ${req.user.id}`);

        return res.status(201).json({
            success: true,
            message: 'Delivery challan created successfully',
            data: { challan }
        });
    } catch (error: any) {
        logger.error('Create delivery challan error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating delivery challan',
            error: error.message
        });
    }
};

// @desc    Update delivery challan
// @route   PUT /api/v1/sales/challans/:id
// @access  Private
export const updateDeliveryChallan = async (req: AuthRequest, res: Response) => {
    try {
        const { challanDate, referenceNumber, items, notes, status } = req.body;

        const existingChallan = await prisma.deliveryChallan.findUnique({
            where: { id: req.params.id , companyId: req.user.companyId }
        });

        if (!existingChallan || existingChallan.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Delivery challan not found'
            });
        }

        // Calculate new totals if items provided
        let subtotal = existingChallan.subtotal.toNumber();
        let totalAmount = existingChallan.totalAmount.toNumber();

        if (items && items.length > 0) {
            subtotal = 0;
            const processedItems = items.map((item: any) => {
                const itemTotal = Number(item.quantity) * Number(item.rate);
                subtotal += itemTotal;
                return {
                    productId: item.productId,
                    productName: item.productName,
                    quantity: Number(item.quantity),
                    rate: Number(item.rate),
                    total: itemTotal
                };
            });
            totalAmount = subtotal;

            // Delete existing items and create new ones
            await prisma.deliveryChallanItem.deleteMany({
                where: { challanId: req.params.id }
            });

            await prisma.deliveryChallanItem.createMany({
                data: processedItems.map((item: any) => ({
                    ...item,
                    challanId: req.params.id
                }))
            });
        }

        const challan = await prisma.deliveryChallan.update({
            where: { id: req.params.id , companyId: req.user.companyId },
            data: {
                challanDate: challanDate ? new Date(challanDate) : undefined,
                referenceNumber: referenceNumber !== undefined ? referenceNumber : undefined,
                subtotal,
                totalAmount,
                status: status || undefined,
                notes: notes !== undefined ? notes : undefined
            },
            include: {
                customer: true,
                items: true
            }
        });

        // Emit domain event
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.DELIVERY_CHALLAN_UPDATED,
            aggregateType: 'DeliveryChallan',
            aggregateId: challan.id,
            payload: challan,
            metadata: { userId: req.user.id, source: 'api' }
        });

        logger.info(`Delivery challan updated: ${challan.challanNumber} by user ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: 'Delivery challan updated successfully',
            data: { challan }
        });
    } catch (error: any) {
        logger.error('Update delivery challan error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating delivery challan',
            error: error.message
        });
    }
};

// @desc    Delete delivery challan
// @route   DELETE /api/v1/sales/challans/:id
// @access  Private
export const deleteDeliveryChallan = async (req: AuthRequest, res: Response) => {
    try {
        const challan = await prisma.deliveryChallan.findUnique({
            where: { id: req.params.id , companyId: req.user.companyId }
        });

        if (!challan || challan.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Delivery challan not found'
            });
        }

        await prisma.deliveryChallan.delete({
            where: { id: req.params.id , companyId: req.user.companyId }
        });

        // Decrement the sequence number to reuse the freed number
        await decrementSequence(req.user.companyId, 'DELIVERY_CHALLAN');

        // Emit domain event
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.DELIVERY_CHALLAN_DELETED,
            aggregateType: 'DeliveryChallan',
            aggregateId: challan.id,
            payload: challan,
            metadata: { userId: req.user.id, source: 'api' }
        });

        logger.info(`Delivery challan deleted: ${challan.challanNumber} by user ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: 'Delivery challan deleted successfully'
        });
    } catch (error: any) {
        logger.error('Delete delivery challan error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting delivery challan',
            error: error.message
        });
    }
};

// @desc    Search delivery challans
// @route   GET /api/v1/sales/challans/search
// @access  Private
export const searchDeliveryChallans = async (req: AuthRequest, res: Response) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const challans = await prisma.deliveryChallan.findMany({
            where: {
                companyId: req.user.companyId,
                OR: [
                    { challanNumber: { contains: q as string } },
                    { referenceNumber: { contains: q as string } },
                ]
            },
            include: {
                customer: true,
                items: true
            },
            orderBy: { challanDate: 'desc' },
            take: 20
        });

        return res.status(200).json({
            success: true,
            data: { challans }
        });
    } catch (error: any) {
        logger.error('Search delivery challans error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error searching delivery challans',
            error: error.message
        });
    }
};
// @desc    Convert challan to invoice
// @route   POST /api/v1/sales/challans/:id/convert
// @access  Private
export const convertChallanToInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Get the challan with all items
        const challan = await prisma.deliveryChallan.findUnique({
            where: { id , companyId: req.user.companyId },
            include: {
                items: true
            }
        });

        if (!challan || challan.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Delivery challan not found'
            });
        }

        // Check if already converted
        if (challan.status === 'CONVERTED') {
            return res.status(400).json({
                success: false,
                message: 'Delivery challan has already been converted to invoice'
            });
        }

        // Generate invoice number
        const invoiceNumber = await getNextNumber(req.user.companyId, 'INVOICE');

        // Prepare invoice items from challan items
        const invoiceItems = challan.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            rate: item.rate,
            taxRate: 18, // Default tax rate if not stored in DC
            taxAmount: 0, // Will be calculated dynamically if needed, or 0
            total: item.total
        }));

        // Recalculate tax for invoice items as DC might not have tax info
        const itemsWithTax = invoiceItems.map(item => {
            // Assuming rate is base. 
            const sub = Number(item.quantity) * Number(item.rate);
            const tax = sub * 0.18; // Default 18% GST assumption for now
            const tot = sub + tax;
            return {
                ...item,
                taxAmount: tax,
                total: tot
            }
        });

        let subtotal = 0;
        let totalTax = 0;

        itemsWithTax.forEach(item => {
            subtotal += (Number(item.quantity) * Number(item.rate));
            totalTax += item.taxAmount;
        });

        const totalAmount = subtotal + totalTax;

        // Create invoice in a transaction
        const [invoice, updatedChallan] = await prisma.$transaction([
            // Create the invoice
            prisma.invoice.create({
                data: {
                    companyId: req.user.companyId,
                    userId: req.user.id,
                    customerId: challan.customerId,
                    invoiceNumber,
                    invoiceDate: new Date(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    status: 'DRAFT',
                    notes: `Converted from Delivery Challan: ${challan.challanNumber}\n${challan.notes || ''}`,
                    subtotal,
                    totalTax,
                    totalAmount,
                    balanceAmount: totalAmount,
                    items: {
                        create: itemsWithTax
                    }
                },
                include: {
                    items: true,
                    customer: true
                }
            }),
            // Update challan status
            prisma.deliveryChallan.update({
                where: { id , companyId: req.user.companyId },
                data: { status: 'CONVERTED' }
            })
        ]);

        // Emit events
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.INVOICE_CREATED,
            aggregateType: 'Invoice',
            aggregateId: invoice.id,
            payload: invoice,
            metadata: { userId: req.user.id, source: 'api' }
        });

        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.DELIVERY_CHALLAN_UPDATED,
            aggregateType: 'DeliveryChallan',
            aggregateId: updatedChallan.id,
            payload: updatedChallan,
            metadata: { userId: req.user.id, source: 'api' }
        });

        logger.info(`Challan ${challan.challanNumber} converted to Invoice ${invoice.invoiceNumber} by ${req.user.email}`);

        return res.status(201).json({
            success: true,
            message: 'Delivery challan converted to invoice successfully',
            data: { invoice }
        });
    } catch (error: any) {
        logger.error('Convert challan to invoice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error converting delivery challan to invoice',
            error: error.message
        });
    }
};
