/**
 * Goods Received Note (GRN) Controller
 * 
 * Handles all GRN-related operations.
 * Split from purchaseController.ts for better maintainability.
 */

import { Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/auth';
import { getNextNumber, decrementSequence } from '../../services/sequenceService';
import eventBus, { EventTypes } from '../../services/eventBus';  // P0-5: Domain events
import logger from '../../config/logger';

// @desc    Get all GRNs
// @route   GET /api/v1/purchases/grn
// @access  Private
export const getGRNs = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        const grns = await prisma.goodsReceivedNote.findMany({
            where: { companyId },
            include: {
                supplier: true,
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            count: grns.length,
            data: grns
        });
    } catch (error) {
        logger.error('Error fetching GRNs:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get single GRN
// @route   GET /api/v1/purchases/grn/:id
// @access  Private
export const getGRN = async (req: AuthRequest, res: Response) => {
    try {
        const grn = await prisma.goodsReceivedNote.findFirst({
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

        if (!grn) {
            res.status(404).json({
                success: false,
                message: 'GRN not found'
            });
            return;
        }

        res.json({
            success: true,
            data: grn
        });
    } catch (error) {
        logger.error('Error fetching GRN:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create GRN
// @route   POST /api/v1/purchases/grn
// @access  Private
export const createGRN = async (req: AuthRequest, res: Response) => {
    try {
        const {
            supplierId,
            grnDate,
            referenceNumber,
            items,
            notes,
            subtotal,
            totalAmount
        } = req.body;

        const companyId = req.user?.companyId;
        const userId = req.user?.id;

        // Use transaction to ensure data integrity
        const grn = await prisma.$transaction(async (tx) => {
            // 1. Create the GRN
            const createdGRN = await tx.goodsReceivedNote.create({
                data: {
                    companyId: companyId!,
                    supplierId,
                    grnNumber: await getNextNumber(companyId!, 'GRN'),
                    grnDate: new Date(grnDate),
                    referenceNumber,
                    notes,
                    subtotal: Number(subtotal || 0),
                    totalAmount: Number(totalAmount || 0),
                    status: 'RECEIVED',
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId || null,
                            productName: item.productName || 'Unknown Product',
                            quantity: Number(item.quantity) || 0,
                            rate: Number(item.rate) || 0,
                            total: Number(item.total || 0),
                            batchNumber: item.batchNumber || null,
                            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
                        }))
                    }
                },
                include: {
                    items: true
                }
            });

            return createdGRN;
        });

        logger.info(`GRN created: ${grn.grnNumber}`);

        // P0-5: Emit domain event for event-driven processing
        try {
            await eventBus.emit({
                companyId: companyId!,
                eventType: EventTypes.GOODS_RECEIVED,
                aggregateType: 'GoodsReceivedNote',
                aggregateId: grn.id,
                payload: {
                    grnId: grn.id,
                    grnNumber: grn.grnNumber,
                    supplierId: supplierId,
                    totalAmount: Number(totalAmount || 0),
                    items: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: Number(item.quantity),
                        batchNumber: item.batchNumber,
                        expiryDate: item.expiryDate
                    }))
                },
                metadata: {
                    userId: userId!,
                    source: 'api'
                }
            });
            logger.info(`[GRN] Emitted GOODS_RECEIVED event for ${grn.grnNumber}`);
        } catch (eventError) {
            logger.warn(`Failed to emit GOODS_RECEIVED event: ${eventError}`);
        }

        res.status(201).json({
            success: true,
            data: grn
        });
    } catch (error) {
        logger.error('Error creating GRN:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update GRN
// @route   PUT /api/v1/purchases/grn/:id
// @access  Private
export const updateGRN = async (req: AuthRequest, res: Response) => {
    try {
        const {
            supplierId,
            grnDate,
            referenceNumber,
            items,
            notes,
            subtotal,
            totalAmount,
            status
        } = req.body;

        const grnId = req.params.id;
        const companyId = req.user?.companyId;

        const existingGRN = await prisma.goodsReceivedNote.findFirst({
            where: { id: grnId, companyId }
        });

        if (!existingGRN) {
            res.status(404).json({
                success: false,
                message: 'GRN not found'
            });
            return;
        }

        await prisma.goodsReceivedNoteItem.deleteMany({
            where: { grnId }
        });

        const updatedGRN = await prisma.goodsReceivedNote.update({
            where: { id: grnId , companyId: req.user.companyId },
            data: {
                supplierId,
                grnDate: new Date(grnDate),
                referenceNumber,
                notes,
                subtotal: Number(subtotal || 0),
                totalAmount: Number(totalAmount || 0),
                status,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId || null,
                        productName: item.productName || 'Unknown Product',
                        quantity: Number(item.quantity) || 0,
                        rate: Number(item.rate) || 0,
                        total: Number(item.total || 0)
                    }))
                }
            },
            include: {
                items: true
            }
        });

        res.json({
            success: true,
            data: updatedGRN
        });
    } catch (error) {
        logger.error('Error updating GRN:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete GRN
// @route   DELETE /api/v1/purchases/grn/:id
// @access  Private
export const deleteGRN = async (req: AuthRequest, res: Response) => {
    try {
        const grn = await prisma.goodsReceivedNote.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user?.companyId
            }
        });

        if (!grn) {
            res.status(404).json({
                success: false,
                message: 'GRN not found'
            });
            return;
        }

        await prisma.goodsReceivedNote.delete({
            where: { id: req.params.id , companyId: req.user.companyId }
        });

        // Emit domain event
        await eventBus.emit({
            companyId: req.user!.companyId!,
            eventType: EventTypes.GRN_DELETED,
            aggregateType: 'GoodsReceivedNote',
            aggregateId: grn.id,
            payload: grn,
            metadata: { userId: req.user!.id, source: 'api' }
        });

        // Decrement the sequence number to reuse the freed number
        await decrementSequence(req.user!.companyId!, 'GRN');

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        logger.error('Error deleting GRN:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
