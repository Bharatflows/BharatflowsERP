/**
 * Wastage Controller
 * 
 * Handles wastage tracking API endpoints:
 * - Record wastage
 * - List wastages
 * - Get wastage summary/analytics
 */

import { Response } from 'express';
import prisma from '../config/prisma';
import { recordWastage, getWastageSummary } from '../services/bomExplosionService';
import logger from '../config/logger';
import { AuthRequest } from '../middleware/auth';
import eventBus, { EventTypes } from '../services/eventBus';

/**
 * Record new wastage
 * POST /api/wastage
 */
export const createWastage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const companyId = req.user?.companyId;
        const userId = req.user?.id;
        const { productId, batchId, quantity, unit, reason, workOrderId, notes } = req.body;

        if (!companyId || !userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // Validate required fields
        if (!productId || !quantity || !unit || !reason) {
            res.status(400).json({
                success: false,
                message: 'productId, quantity, unit, and reason are required',
            });
            return;
        }

        // Validate reason
        const validReasons = ['EXPIRED', 'DAMAGED', 'PRODUCTION_LOSS', 'SPILLAGE', 'QC_REJECT', 'OTHER'];
        if (!validReasons.includes(reason)) {
            res.status(400).json({
                success: false,
                message: `Invalid reason. Must be one of: ${validReasons.join(', ')}`,
            });
            return;
        }

        const result = await recordWastage(
            { productId, batchId, quantity, unit, reason, workOrderId, notes },
            companyId,
            userId
        );

        // Phase 9: Emit event for accounting integration
        if (result.success) {
            // Get product info for cost calculation
            const product = await prisma.product.findUnique({
                where: { id: productId , companyId: req.user.companyId },
                select: { id: true, name: true, currentStock: true, purchasePrice: true }
            });

            const estimatedCost = Number(product?.purchasePrice || 0) * Number(quantity);

            eventBus.emit({
                companyId,
                eventType: EventTypes.WASTAGE_RECORDED,
                aggregateType: 'WastageLog',
                aggregateId: result.wastageId,
                payload: {
                    wastageId: result.wastageId,
                    productId,
                    productName: product?.name || 'Unknown',
                    quantity: Number(quantity),
                    unit,
                    reason,
                    estimatedCost,
                    workOrderId,
                    batchId
                },
                metadata: {
                    userId,
                    source: 'api'
                }
            });
        }

        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        logger.error('Create wastage failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to record wastage',
        });
    }
};

/**
 * List wastages with pagination
 * GET /api/wastage
 */
export const listWastages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const companyId = req.user?.companyId;

        if (!companyId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const {
            page = 1,
            limit = 20,
            productId,
            reason,
            startDate,
            endDate,
            workOrderId
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        const where: any = { companyId };

        if (productId) where.productId = productId as string;
        if (reason) where.reason = reason as string;
        if (workOrderId) where.workOrderId = workOrderId as string;

        if (startDate || endDate) {
            where.recordedAt = {};
            if (startDate) where.recordedAt.gte = new Date(startDate as string);
            if (endDate) where.recordedAt.lte = new Date(endDate as string);
        }

        const [wastages, total] = await Promise.all([
            prisma.wastageLog.findMany({
                where,
                include: {
                    product: { select: { id: true, name: true, code: true } },
                    batch: { select: { id: true, batchNumber: true } },
                    workOrder: { select: { id: true, orderNumber: true } },
                },
                orderBy: { recordedAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma.wastageLog.count({ where }),
        ]);

        res.json({
            success: true,
            data: wastages,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error: any) {
        logger.error('List wastages failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch wastages',
        });
    }
};

/**
 * Get single wastage by ID
 * GET /api/wastage/:id
 */
export const getWastage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const companyId = req.user?.companyId;
        const { id } = req.params;

        if (!companyId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const wastage = await prisma.wastageLog.findFirst({
            where: { id, companyId },
            include: {
                product: true,
                batch: true,
                workOrder: true,
            },
        });

        if (!wastage) {
            res.status(404).json({
                success: false,
                message: 'Wastage record not found',
            });
            return;
        }

        res.json({
            success: true,
            data: wastage,
        });
    } catch (error: any) {
        logger.error('Get wastage failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch wastage',
        });
    }
};

/**
 * Get wastage summary/analytics
 * GET /api/wastage/summary
 */
export const getWastageAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const companyId = req.user?.companyId;

        if (!companyId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { startDate, endDate } = req.query;

        // Default to last 30 days
        const end = endDate ? new Date(endDate as string) : new Date();
        const start = startDate
            ? new Date(startDate as string)
            : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

        const summary = await getWastageSummary(companyId, start, end);

        res.json({
            success: true,
            data: {
                ...summary,
                period: { start, end },
            },
        });
    } catch (error: any) {
        logger.error('Get wastage analytics failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch wastage analytics',
        });
    }
};

export default {
    createWastage,
    listWastages,
    getWastage,
    getWastageAnalytics,
};
