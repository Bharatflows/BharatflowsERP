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
        console.error('Error fetching purchase orders:', error);
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
        console.error('Error fetching purchase order:', error);
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

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error: any) {
        console.error('Error creating purchase order:', error);
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
            where: { id: orderId },
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

        res.json({
            success: true,
            data: updatedOrder
        });
    } catch (error) {
        console.error('Error updating purchase order:', error);
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
            where: { id: req.params.id }
        });

        // Decrement the sequence number to reuse the freed number
        await decrementSequence(req.user!.companyId!, 'PURCHASE_ORDER');

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting purchase order:', error);
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

        const validStatuses = ['DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
            return;
        }

        const order = await prisma.purchaseOrder.findFirst({
            where: { id: orderId, companyId }
        });

        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
            return;
        }

        const updatedOrder = await prisma.purchaseOrder.update({
            where: { id: orderId },
            data: { status }
        });

        res.json({
            success: true,
            data: updatedOrder,
            message: `Order status updated to ${status}`
        });
    } catch (error) {
        console.error('Error updating purchase order status:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
