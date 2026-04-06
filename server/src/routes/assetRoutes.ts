/**
 * Asset Routes
 * API endpoints for Fixed Assets, Categories, and Depreciation
 */

import { Router } from 'express';
import { protect } from '../middleware/auth';
import prisma from '../config/prisma';
import { assetService } from '../services/assetService';
import logger from '../config/logger';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// ==================== Asset Categories ====================
router.get('/categories', async (req: AuthRequest, res: Response) => {
    try {
        const categories = await prisma.assetCategory.findMany({
            where: { companyId: req.user.companyId },
            include: { assets: { select: { id: true } } },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: categories });
    } catch (error: any) {
        logger.error('Get categories error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/categories/:id', async (req: AuthRequest, res: Response) => {
    try {
        const category = await prisma.assetCategory.findFirst({
            where: { id: req.params.id, companyId: req.user.companyId },
            include: { assets: true }
        });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, data: category });
    } catch (error: any) {
        logger.error('Get category error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/categories', async (req: AuthRequest, res: Response) => {
    try {
        const { name, depreciationMethod, totalNumberOfDepreciations, frequencyOfDepreciation,
            assetAccountId, accumulatedDepreciationAccountId, depreciationExpenseAccountId } = req.body;

        const category = await prisma.assetCategory.create({
            data: {
                name,
                depreciationMethod: depreciationMethod || 'STRAIGHT_LINE',
                totalNumberOfDepreciations: totalNumberOfDepreciations || 60,
                frequencyOfDepreciation: frequencyOfDepreciation || 1,
                assetAccountId,
                accumulatedDepreciationAccountId,
                depreciationExpenseAccountId,
                companyId: req.user.companyId
            }
        });
        res.status(201).json({ success: true, data: category });
    } catch (error: any) {
        logger.error('Create category error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/categories/:id', async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.assetCategory.findFirst({
            where: { id: req.params.id, companyId: req.user.companyId }
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const category = await prisma.assetCategory.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: category });
    } catch (error: any) {
        logger.error('Update category error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.assetCategory.findFirst({
            where: { id: req.params.id, companyId: req.user.companyId },
            include: { assets: { select: { id: true } } }
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        if (existing.assets.length > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete category with assets' });
        }

        await prisma.assetCategory.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Category deleted' });
    } catch (error: any) {
        logger.error('Delete category error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== Assets ====================
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { status, categoryId, search } = req.query;
        const where: any = { companyId: req.user.companyId };

        if (status) where.status = status;
        if (categoryId) where.categoryId = categoryId;
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { assetCode: { contains: search as string, mode: 'insensitive' } },
                { location: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const assets = await prisma.asset.findMany({
            where,
            include: {
                category: true,
                depreciationSchedules: { orderBy: { scheduleDate: 'asc' } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: assets });
    } catch (error: any) {
        logger.error('Get assets error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const asset = await prisma.asset.findFirst({
            where: { id: req.params.id, companyId: req.user.companyId },
            include: {
                category: true,
                depreciationSchedules: { orderBy: { scheduleDate: 'asc' } },
                purchaseInvoice: true
            }
        });
        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }
        res.json({ success: true, data: asset });
    } catch (error: any) {
        logger.error('Get asset error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const result = await assetService.createAsset({
            ...req.body,
            companyId: req.user.companyId,
            userId: req.user.id
        });
        res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Create asset error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.asset.findFirst({
            where: { id: req.params.id, companyId: req.user.companyId }
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        const asset = await prisma.asset.update({
            where: { id: req.params.id },
            data: req.body,
            include: { category: true }
        });
        res.json({ success: true, data: asset });
    } catch (error: any) {
        logger.error('Update asset error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const existing = await prisma.asset.findFirst({
            where: { id: req.params.id, companyId: req.user.companyId }
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }
        if (existing.status !== 'DRAFT') {
            return res.status(400).json({ success: false, message: 'Only draft assets can be deleted' });
        }

        await prisma.asset.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Asset deleted' });
    } catch (error: any) {
        logger.error('Delete asset error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== Asset Actions ====================
router.post('/:id/submit', async (req: AuthRequest, res: Response) => {
    try {
        const asset = await prisma.asset.findFirst({
            where: { id: req.params.id, companyId: req.user.companyId }
        });
        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }
        if (asset.status !== 'DRAFT') {
            return res.status(400).json({ success: false, message: 'Asset is not in draft status' });
        }

        const updated = await prisma.asset.update({
            where: { id: req.params.id },
            data: { status: 'SUBMITTED' }
        });
        res.json({ success: true, data: updated });
    } catch (error: any) {
        logger.error('Submit asset error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/:id/generate-schedules', async (req: AuthRequest, res: Response) => {
    try {
        const result = await assetService.generateDepreciationSchedule(req.params.id, req.user.companyId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Generate schedules error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/depreciation/post', async (req: AuthRequest, res: Response) => {
    try {
        const { scheduleId } = req.body;
        const result = await assetService.postDepreciation(scheduleId, req.user.companyId, req.user.id);
        res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Post depreciation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== Dashboard Stats ====================
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;

        const [totalAssets, byStatus, totalValue] = await Promise.all([
            prisma.asset.count({ where: { companyId } }),
            prisma.asset.groupBy({
                by: ['status'],
                where: { companyId },
                _count: true
            }),
            prisma.asset.aggregate({
                where: { companyId },
                _sum: { grossPurchaseAmount: true }
            })
        ]);

        const statusCounts = byStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
        }, {} as Record<string, number>);

        res.json({
            success: true,
            data: {
                totalAssets,
                totalValue: totalValue._sum.grossPurchaseAmount || 0,
                draft: statusCounts['DRAFT'] || 0,
                depreciating: statusCounts['DEPRECIATING'] || 0,
                fullyDepreciated: statusCounts['FULLY_DEPRECIATED'] || 0
            }
        });
    } catch (error: any) {
        logger.error('Get stats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
