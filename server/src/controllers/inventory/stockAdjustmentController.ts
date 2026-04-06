import { Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/auth';
import sequenceService from '../../services/sequenceService';
import eventBus, { EventTypes } from '../../services/eventBus';
import { requireUnlockedPeriod } from '../../services/periodLockService';
import logger from '../../config/logger';

/**
 * Get all stock adjustments
 */
export const getStockAdjustments = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { page = 1, limit = 10, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = { companyId };

        if (search) {
            where.OR = [
                { adjustmentNumber: { contains: search as string } },
                { reason: { contains: search as string } },
                { notes: { contains: search as string } }
            ];
        }

        const [adjustments, total] = await Promise.all([
            prisma.stockAdjustment.findMany({
                where,
                include: {
                    items: {
                        include: {
                            product: {
                                select: { name: true, code: true, unit: true }
                            }
                        }
                    }
                },
                orderBy: { date: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.stockAdjustment.count({ where })
        ]);

        return res.json({
            success: true,
            data: adjustments,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        logger.error('Get stock adjustments error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get stock adjustment by ID
 */
export const getStockAdjustmentById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;

        const adjustment = await prisma.stockAdjustment.findFirst({
            where: { id, companyId },
            include: {
                items: {
                    include: {
                        product: {
                            select: { name: true, code: true, unit: true }
                        },
                        batch: true
                    }
                }
            }
        });

        if (!adjustment) {
            return res.status(404).json({ success: false, message: 'Stock adjustment not found' });
        }

        return res.json({ success: true, data: adjustment });
    } catch (error: any) {
        logger.error('Get stock adjustment error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create stock adjustment
 */
export const createStockAdjustment = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const { date, reason, notes, type, items } = req.body;

        // P0: FY Locking Check
        await requireUnlockedPeriod(companyId, new Date(date));

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Adjustment must contain at least one item' });
        }

        const adjustmentNumber = await sequenceService.getNextNumber(companyId, 'STOCK_ADJUSTMENT');

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the adjustment record
            const adjustment = await tx.stockAdjustment.create({
                data: {
                    adjustmentNumber,
                    date: new Date(date),
                    reason,
                    notes,
                    type: type || 'QUANTITY',
                    companyId,
                    createdBy: userId,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            variation: item.variation,
                            previousStock: item.previousStock || 0,
                            newStock: (item.previousStock || 0) + item.variation,
                            reason: item.reason || reason,
                            batchId: item.batchId
                        }))
                    }
                },
                include: { items: true }
            });

            // 2. Update product stock and log movements
            for (const item of items) {
                const product = await tx.product.findFirst({
                    where: { id: item.productId, companyId },
                    select: { currentStock: true, trackInventory: true }
                });

                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                if (product.trackInventory) {
                    const previousStock = product.currentStock;
                    const newStock = previousStock + item.variation;

                    if (newStock < 0) {
                        throw new Error(`Insufficient stock for product ${item.productId}`);
                    }

                    // Update Product Stock
                    await tx.product.updateMany({
                        where: { id: item.productId, companyId },
                        data: { currentStock: newStock }
                    });

                    // Update Batch Stock if applicable
                    if (item.batchId) {
                        await tx.stockBatch.updateMany({
                            where: { id: item.batchId, companyId },
                            data: { quantity: { increment: item.variation } }
                        });
                    }

                    // Create Stock Movement Log
                    await tx.stockMovement.create({
                        data: {
                            companyId,
                            productId: item.productId,
                            type: 'ADJUSTMENT',
                            quantity: item.variation,
                            previousStock,
                            newStock,
                            reference: adjustmentNumber,
                            reason: item.reason || reason || 'Inventory Adjustment',
                            createdBy: userId,
                            batchId: item.batchId
                        }
                    });
                }
            }

            return adjustment;
        });

        // 3. Emit Domain Event
        await eventBus.emit({
            companyId,
            eventType: EventTypes.STOCK_ADJUSTED,
            aggregateType: 'StockAdjustment',
            aggregateId: result.id,
            payload: {
                adjustmentNumber: result.adjustmentNumber,
                items: items.map((i: any) => ({ productId: i.productId, variation: i.variation }))
            },
            metadata: { userId, source: 'api' }
        });

        return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Create stock adjustment error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete stock adjustment (revert changes)
 */
export const deleteStockAdjustment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;
        const userId = req.user!.id;

        const adjustment = await prisma.stockAdjustment.findFirst({
            where: { id, companyId },
            include: { items: true }
        });

        if (!adjustment) {
            return res.status(404).json({ success: false, message: 'Stock adjustment not found' });
        }

        // P0: FY Locking Check
        await requireUnlockedPeriod(companyId, new Date(adjustment.date), 'delete stock adjustment');

        if (adjustment.status === 'CANCELLED') {
            return res.status(400).json({ success: false, message: 'Adjustment is already cancelled' });
        }

        await prisma.$transaction(async (tx) => {
            // Revert each item
            for (const item of adjustment.items) {
                const product = await tx.product.findFirst({
                    where: { id: item.productId, companyId },
                    select: { currentStock: true, trackInventory: true }
                });

                if (product && product.trackInventory) {
                    const previousStock = product.currentStock;
                    const newStock = previousStock - item.variation; // Revert variation

                    if (newStock < 0) {
                        throw new Error(`Cannot delete adjustment: resulting stock for product ${item.productId} would be negative`);
                    }

                    await tx.product.updateMany({
                        where: { id: item.productId, companyId },
                        data: { currentStock: newStock }
                    });

                    if (item.batchId) {
                        await tx.stockBatch.updateMany({
                            where: { id: item.batchId, companyId },
                            data: { quantity: { decrement: item.variation } }
                        });
                    }

                    // Log Reversal Movement
                    await tx.stockMovement.create({
                        data: {
                            companyId,
                            productId: item.productId,
                            type: 'ADJUSTMENT_REVERSAL',
                            quantity: -item.variation,
                            previousStock,
                            newStock,
                            reference: adjustment.adjustmentNumber,
                            reason: `Reversal of adjustment ${adjustment.adjustmentNumber}`,
                            createdBy: userId,
                            batchId: item.batchId
                        }
                    });
                }
            }

            // Mark as cancelled instead of deleting?
            // ERPs usually keep records. I'll update status to CANCELLED.
            await tx.stockAdjustment.updateMany({
                where: { id, companyId },
                data: { status: 'CANCELLED' }
            });
        });



        // P0: Emit Domain Event
        try {
            await eventBus.emit({
                companyId,
                eventType: EventTypes.STOCK_ADJUSTMENT_REVERSED,
                aggregateType: 'StockAdjustment',
                aggregateId: id,
                payload: {
                    adjustmentId: id,
                    status: 'CANCELLED'
                },
                metadata: { userId, source: 'api' }
            });
        } catch (error) {
            logger.error('Error emitting stock adjustment reversal event:', error);
        }

        return res.json({ success: true, message: 'Stock adjustment cancelled and stock reverted' });
    } catch (error: any) {
        logger.error('Delete stock adjustment error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
