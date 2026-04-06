import { stockService } from '../../services/stockService';

/**
 * Stock Controller
 * 
 * Handles stock-related operations: adjustments, transfers, movements, valuation.
 * Split from inventoryController.ts for better maintainability.
 */

import { Response } from 'express';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import { ProtectedRequest } from '../../middleware/auth';

// Stock Adjustment
export const adjustStock = async (req: ProtectedRequest, res: Response) => {
    try {
        const {
            productId,
            quantity,
            type,
            reason,
            notes,
            warehouseId
        } = req.body;

        const companyId = req.user.companyId;
        const userId = req.user.id;

        const result = await stockService.adjustStock({
            productId,
            quantity,
            type,
            reason,
            notes,
            warehouseId,
            companyId,
            userId
        });

        return res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        logger.error('Stock adjustment error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error adjusting stock'
        });
    }
};

// Get Low Stock Products (Logic remains in controller as it's a read operation)
export const getLowStock = async (req: ProtectedRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;

        const lowStockProducts = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true,
                AND: [
                    {
                        currentStock: {
                            lte: prisma.product.fields.minStock
                        }
                    }
                ]
            },
            orderBy: {
                currentStock: 'asc'
            }
        });

        res.json({
            success: true,
            data: lowStockProducts
        });
    } catch (error: any) {
        logger.error('Get low stock error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching low stock products'
        });
    }
};

// Stock Transfer
export const transferStock = async (req: ProtectedRequest, res: Response) => {
    try {
        const {
            productId,
            fromWarehouseId,
            toWarehouseId,
            quantity,
            notes
        } = req.body;

        const companyId = req.user.companyId;
        const userId = req.user.id;

        const result = await stockService.transferStock({
            productId,
            fromWarehouseId,
            toWarehouseId,
            quantity,
            notes,
            companyId,
            userId
        });

        return res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        logger.error('Stock transfer error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error transferring stock'
        });
    }
};

// Get Stock History for Product
export const getStockHistory = async (req: ProtectedRequest, res: Response) => {
    try {
        const { productId } = req.params;
        const companyId = req.user.companyId;

        const movements = await prisma.stockMovement.findMany({
            where: {
                productId,
                companyId
            },
            include: {
                product: true,
                warehouse: true,
                batch: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            data: movements
        });
    } catch (error: any) {
        logger.error('Get stock history error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching stock history'
        });
    }
};

// Create a new batch
export const createBatch = async (req: ProtectedRequest, res: Response) => {
    try {
        const {
            productId,
            batchNumber,
            quantity,
            mfgDate,
            expiryDate,
            mrp,
            costPrice,
            sellingPrice
        } = req.body;

        const companyId = req.user.companyId;
        const userId = req.user.id;

        const product = await prisma.product.findFirst({
            where: { id: productId, companyId }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const batch = await prisma.stockBatch.create({
            data: {
                productId,
                batchNumber,
                quantity: parseInt(quantity) || 0,
                mfgDate: mfgDate ? new Date(mfgDate) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                mrp: mrp ? parseFloat(mrp) : null,
                costPrice: costPrice ? parseFloat(costPrice) : null,
                sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
                companyId
            }
        });

        // Also update total product stock if initial quantity > 0
        if (parseInt(quantity) > 0) {
            await prisma.product.update({
                where: { id: productId , companyId: req.user.companyId },
                data: { currentStock: { increment: parseInt(quantity) } }
            });

            // Log movement
            await prisma.stockMovement.create({
                data: {
                    productId,
                    type: 'BATCH_OPENING',
                    quantity: parseInt(quantity),
                    previousStock: product.currentStock,
                    newStock: product.currentStock + parseInt(quantity),
                    batchId: batch.id,
                    createdBy: userId,
                    companyId
                }
            });
        }

        return res.status(201).json({
            success: true,
            data: batch
        });
    } catch (error: any) {
        logger.error('Create batch error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error creating batch'
        });
    }
};

// Get batches for a product
export const getBatches = async (req: ProtectedRequest, res: Response) => {
    try {
        const { productId } = req.params;
        const companyId = req.user.companyId;

        const batches = await prisma.stockBatch.findMany({
            where: {
                productId,
                companyId,
                isActive: true,
                quantity: { gt: 0 } // Only fetch non-empty batches by default
            },
            orderBy: {
                expiryDate: 'asc' // First expiring first
            }
        });

        res.json({
            success: true,
            data: batches
        });
    } catch (error: any) {
        logger.error('Get batches error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching batches'
        });
    }
};

// Get All Stock Movements
export const getStockMovements = async (req: ProtectedRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { type, startDate, endDate, limit = '50' } = req.query;

        const where: any = { companyId };

        if (type) {
            where.type = type;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const movements = await prisma.stockMovement.findMany({
            where,
            include: {
                product: true,
                warehouse: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: parseInt(limit as string)
        });

        res.json({
            success: true,
            data: movements
        });
    } catch (error: any) {
        logger.error('Get stock movements error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching stock movements'
        });
    }
};

// Inventory Valuation
export const getInventoryValuation = async (req: ProtectedRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;

        const products = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true
            }
        });

        let totalValue = 0;
        const breakdown: any[] = [];
        const categoryMap = new Map<string, number>();

        products.forEach(product => {
            const value = product.currentStock * Number(product.purchasePrice);
            totalValue += value;

            const category = product.category || 'Uncategorized';
            categoryMap.set(category, (categoryMap.get(category) || 0) + value);
        });

        categoryMap.forEach((value, category) => {
            breakdown.push({ category, value });
        });

        res.json({
            success: true,
            data: {
                totalValue,
                totalProducts: products.length,
                totalStock: products.reduce((sum, p) => sum + p.currentStock, 0),
                breakdown,
                method: 'AVERAGE_COST'
            }
        });
    } catch (error: any) {
        logger.error('Get inventory valuation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error calculating inventory valuation'
        });
    }
};
