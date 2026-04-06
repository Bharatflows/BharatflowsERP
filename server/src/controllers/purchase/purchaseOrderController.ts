/**
 * Purchase Order Controller
 * 
 * Handles all purchase order-related operations.
 * Split from purchaseController.ts for better maintainability.
 */

import { Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/auth';
import { getNextNumber, decrementSequence } from '../../services/sequenceService';
import { eventBus, EventTypes } from '../../services/eventBus';
import logger from '../../config/logger';

// @desc    Get all purchase orders
// @route   GET /api/v1/purchases
// @access  Private
export const getPurchaseOrders = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        const orders = await prisma.purchaseOrder.findMany({
            where: { companyId },
            include: {
                supplier: true,
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        logger.error('Error fetching purchase orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get single purchase order
// @route   GET /api/v1/purchases/:id
// @access  Private
export const getPurchaseOrder = async (req: AuthRequest, res: Response) => {
    try {
        const order = await prisma.purchaseOrder.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user?.companyId
            },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
            return;
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        logger.error('Error fetching purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create purchase order
// @route   POST /api/v1/purchases
// @access  Private
export const createPurchaseOrder = async (req: AuthRequest, res: Response) => {
    try {
        const {
            supplierId,
            supplierInvoiceNumber,
            orderDate,
            billDate,
            expectedDate,
            items,
            notes,
            subtotal,
            totalTax,
            totalAmount,
            paidAmount
        } = req.body;

        const companyId = req.user?.companyId;

        // Validate required fields
        if (!supplierId) {
            res.status(400).json({
                success: false,
                message: 'Supplier is required'
            });
            return;
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Items are required'
            });
            return;
        }

        // Create order with items
        const order = await prisma.purchaseOrder.create({
            data: {
                companyId: companyId!,
                supplierId,
                orderNumber: await getNextNumber(companyId!, 'PURCHASE_ORDER'),
                supplierInvoiceNumber,
                orderDate: new Date(orderDate),
                billDate: billDate ? new Date(billDate) : null,
                expectedDate: expectedDate ? new Date(expectedDate) : null,
                notes,
                subtotal: Number(subtotal || 0),
                totalTax: Number(totalTax || 0),
                totalAmount: Number(totalAmount || 0),
                paidAmount: Number(paidAmount || 0),
                status: req.body.status || 'DRAFT',
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId || null,
                        productName: item.productName || 'Unknown Product',
                        quantity: Number(item.quantity) || 0,
                        receivedQuantity: Number(item.receivedQuantity || 0),
                        rate: Number(item.rate) || 0,
                        taxRate: Number(item.taxRate || 0),
                        taxAmount: Number(item.taxAmount || 0),
                        total: Number(item.total || item.amount || 0)
                    }))
                }
            },
            include: {
                items: true
            }
        });

        // Emit event
        await eventBus.emit({
            companyId: companyId!,
            eventType: EventTypes.PURCHASE_ORDER_CREATED,
            aggregateType: 'PurchaseOrder',
            aggregateId: order.id,
            payload: order,
            metadata: { userId: req.user.id, source: 'api' }
        });

        logger.info(`Purchase Order created: ${order.orderNumber} by ${req.user.email}`);

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error: any) {
        logger.error('Error creating purchase order:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};

// @desc    Update purchase order
// @route   PUT /api/v1/purchases/:id
// @access  Private
export const updatePurchaseOrder = async (req: AuthRequest, res: Response) => {
    try {
        const {
            supplierId,
            supplierInvoiceNumber,
            orderDate,
            billDate,
            expectedDate,
            items,
            notes,
            subtotal,
            totalTax,
            totalAmount,
            paidAmount,
            status
        } = req.body;

        const orderId = req.params.id;
        const companyId = req.user?.companyId;

        const existingOrder = await prisma.purchaseOrder.findFirst({
            where: { id: orderId, companyId }
        });

        if (!existingOrder) {
            res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
            return;
        }

        await prisma.purchaseOrderItem.deleteMany({
            where: { purchaseOrderId: orderId }
        });

        const updatedOrder = await prisma.purchaseOrder.update({
            where: { id: orderId , companyId: req.user.companyId },
            data: {
                supplierId,
                supplierInvoiceNumber,
                orderDate: new Date(orderDate),
                billDate: billDate ? new Date(billDate) : null,
                expectedDate: expectedDate ? new Date(expectedDate) : null,
                notes,
                subtotal: Number(subtotal || 0),
                totalTax: Number(totalTax || 0),
                totalAmount: Number(totalAmount || 0),
                paidAmount: Number(paidAmount || 0),
                status,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId || null,
                        productName: item.productName || 'Unknown Product',
                        quantity: Number(item.quantity) || 0,
                        receivedQuantity: Number(item.receivedQuantity || 0),
                        rate: Number(item.rate) || 0,
                        taxRate: Number(item.taxRate || 0),
                        taxAmount: Number(item.taxAmount || 0),
                        total: Number(item.total || item.amount || 0)
                    }))
                }
            },
            include: {
                items: true
            }
        });

        // Emit event
        await eventBus.emit({
            companyId,
            eventType: EventTypes.PURCHASE_ORDER_UPDATED,
            aggregateType: 'PurchaseOrder',
            aggregateId: updatedOrder.id,
            payload: updatedOrder,
            metadata: { userId: req.user.id, source: 'api' }
        });

        logger.info(`Purchase Order updated: ${updatedOrder.orderNumber} by ${req.user.email}`);

        res.json({
            success: true,
            data: updatedOrder
        });
    } catch (error) {
        logger.error('Error updating purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete purchase order
// @route   DELETE /api/v1/purchases/:id
// @access  Private
export const deletePurchaseOrder = async (req: AuthRequest, res: Response) => {
    try {
        const order = await prisma.purchaseOrder.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user?.companyId
            }
        });

        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
            return;
        }

        await prisma.purchaseOrder.delete({
            where: { id: req.params.id , companyId: req.user.companyId }
        });

        // Decrement the sequence number to reuse the freed number
        await decrementSequence(req.user!.companyId!, 'PURCHASE_ORDER');

        // Emit domain event
        await eventBus.emit({
            companyId: req.user!.companyId!,
            eventType: EventTypes.PURCHASE_ORDER_DELETED,
            aggregateType: 'PurchaseOrder',
            aggregateId: order.id,
            payload: order,
            metadata: { userId: req.user!.id, source: 'api' }
        });

        logger.info(`Purchase Order deleted: ${order.orderNumber} by ${req.user!.email}`);

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        logger.error('Error deleting purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update purchase order status
// @route   PATCH /api/v1/purchases/:id/status
// @access  Private
export const updatePurchaseOrderStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;
        const companyId = req.user?.companyId;

        const validStatuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SENT', 'PARTIAL', 'RECEIVED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
            return;
        }

        const order = await prisma.purchaseOrder.findFirst({
            where: { id: orderId, companyId },
            include: { supplier: true }
        });

        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Purchase Order not found'
            });
            return;
        }

        // Approval Check Logic
        // If trying to mark as SENT or APPROVED, check if approval is needed
        if ((status === 'SENT' || status === 'APPROVED') && order.status === 'DRAFT') {
            const approvalService = require('../../services/approvalService').approvalService; // Lazy load

            // Check if workflow exists and applies
            // We use a helper from approvalService or workflowService
            // For now, let's assume we call requestApproval directly if we want to trigger it?
            // Actually, best practice is: User clicks "Submit for Approval" -> Status PENDING_APPROVAL
            // If they click "Send", we check.

            // Let's use the explicit 'PENDING_APPROVAL' transition or check requirement.
            // Using workflowService directly:
            const { workflowService } = require('../../services/workflowService');
            const isRequired = await workflowService.checkApprovalRequired(companyId, 'PurchaseOrder', Number(order.totalAmount));

            if (isRequired) {
                // Initiate Approval
                await approvalService.requestApproval({
                    companyId: companyId!,
                    entityType: 'PurchaseOrder',
                    entityId: orderId,
                    requestorId: req.user!.id,
                    amount: Number(order.totalAmount),
                    details: {
                        orderNumber: order.orderNumber,
                        supplierName: order.supplier.name
                    }
                });

                // Update status to PENDING_APPROVAL instead
                const updatedOrder = await prisma.purchaseOrder.update({
                    where: { id: orderId , companyId: req.user.companyId },
                    data: { status: 'PENDING_APPROVAL' }
                });

                res.json({
                    success: true,
                    data: updatedOrder,
                    message: 'Approval required. Request submitted successfully.'
                });
                return;
            }
        }

        const updatedOrder = await prisma.purchaseOrder.update({
            where: { id: orderId , companyId: req.user.companyId },
            data: { status }
        });

        res.json({
            success: true,
            data: updatedOrder,
            message: `Order status updated to ${status}`
        });
    } catch (error) {
        logger.error('Error updating purchase order status:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Convert Purchase Order to GRN
// @route   POST /api/v1/purchases/:id/convert-to-grn
// @access  Private
export const convertPOToGRN = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;

        // Get the PO with all items
        const po = await prisma.purchaseOrder.findFirst({
            where: { id, companyId },
            include: { items: true }
        });

        if (!po) {
            res.status(404).json({
                success: false,
                message: 'Purchase Order not found'
            });
            return;
        }

        // Check if already converted/received
        if (po.status === 'RECEIVED') {
            res.status(400).json({
                success: false,
                message: 'Purchase Order has already been fully received'
            });
            return;
        }

        // Create GRN in transaction
        const [grn, updatedPO] = await prisma.$transaction([
            // Create GRN
            prisma.goodsReceivedNote.create({
                data: {
                    companyId: companyId!,
                    supplierId: po.supplierId,
                    grnNumber: await getNextNumber(companyId!, 'GRN'),
                    grnDate: new Date(),
                    referenceNumber: po.orderNumber,
                    notes: `Converted from PO: ${po.orderNumber}\n${po.notes || ''}`,
                    subtotal: po.subtotal,
                    totalAmount: po.totalAmount,
                    status: 'RECEIVED',
                    items: {
                        create: po.items.map(item => ({
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            rate: item.rate,
                            total: Number(item.quantity) * Number(item.rate)
                        }))
                    }
                },
                include: { items: true }
            }),
            // Update PO status
            prisma.purchaseOrder.update({
                where: { id , companyId: req.user.companyId },
                data: { status: 'RECEIVED' }
            })
        ]);

        // Emit GOODS_RECEIVED event
        await eventBus.emit({
            companyId: companyId!,
            eventType: EventTypes.GOODS_RECEIVED,
            aggregateType: 'GoodsReceivedNote',
            aggregateId: grn.id,
            payload: {
                grnId: grn.id,
                grnNumber: grn.grnNumber,
                supplierId: grn.supplierId,
                totalAmount: Number(grn.totalAmount),
                items: grn.items.map(i => ({
                    productId: i.productId,
                    quantity: Number(i.quantity),
                    batchNumber: null,
                    expiryDate: null
                }))
            },
            metadata: { userId: req.user!.id, source: 'api' }
        });

        logger.info(`PO ${po.orderNumber} converted to GRN ${grn.grnNumber} by ${req.user!.email}`);

        res.status(201).json({
            success: true,
            message: 'Purchase Order converted to GRN successfully',
            data: { grn }
        });
    } catch (error: any) {
        logger.error('Convert PO to GRN error:', error);
        res.status(500).json({
            success: false,
            message: 'Error converting Purchase Order to GRN',
            error: error.message
        });
    }
};

// @desc    Convert Purchase Order to Purchase Bill
// @route   POST /api/v1/purchases/:id/convert-to-bill
// @access  Private
export const convertPOToBill = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;

        // Get the PO with all items
        const po = await prisma.purchaseOrder.findFirst({
            where: { id, companyId },
            include: { items: true }
        });

        if (!po) {
            res.status(404).json({
                success: false,
                message: 'Purchase Order not found'
            });
            return;
        }

        // Check if already billed or cancelled
        if (po.status === 'CANCELLED' || po.status === 'BILLED') {
            res.status(400).json({
                success: false,
                message: po.status === 'CANCELLED' 
                    ? 'Cannot create bill for a cancelled Purchase Order' 
                    : 'Purchase Order has already been billed'
            });
            return;
        }

        // Create Purchase Bill in transaction
        const [bill, updatedPO] = await prisma.$transaction([
            // Create Purchase Bill
            prisma.purchaseBill.create({
                data: {
                    companyId: companyId!,
                    supplierId: po.supplierId,
                    billNumber: await getNextNumber(companyId!, 'PURCHASE_BILL'),
                    billDate: new Date(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    status: 'DRAFT',
                    notes: `Converted from PO: ${po.orderNumber}\n${po.notes || ''}`,
                    subtotal: po.subtotal,
                    totalTax: po.totalTax,
                    totalAmount: po.totalAmount,
                    balanceAmount: po.totalAmount,
                    items: {
                        create: po.items.map(item => ({
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            rate: item.rate,
                            taxRate: item.taxRate,
                            taxAmount: item.taxAmount,
                            total: item.total
                        }))
                    }
                },
                include: { items: true }
            }),
            // Update PO status
            prisma.purchaseOrder.update({
                where: { id , companyId: req.user.companyId },
                data: { status: 'BILLED' }
            })
        ]);

        // P0: Emit PURCHASE_BILL_CREATED event
        await eventBus.emit({
            companyId: companyId!,
            eventType: EventTypes.PURCHASE_BILL_CREATED,
            aggregateType: 'PurchaseBill',
            aggregateId: bill.id,
            payload: {
                billId: bill.id,
                billNumber: bill.billNumber,
                billDate: bill.billDate.toISOString(),
                supplierId: bill.supplierId,
                subtotal: Number(bill.subtotal),
                taxAmount: Number(bill.totalTax),
                totalAmount: Number(bill.totalAmount)
            },
            metadata: { userId: req.user!.id, source: 'api' }
        });

        logger.info(`PO ${po.orderNumber} converted to Bill ${bill.billNumber} by ${req.user!.email}`);

        res.status(201).json({
            success: true,
            message: 'Purchase Order converted to Bill successfully',
            data: { bill }
        });
    } catch (error: any) {
        logger.error('Convert PO to Bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Error converting Purchase Order to Bill',
            error: error.message
        });
    }
};
