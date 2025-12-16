/**
 * Stock Controller
 * 
 * Handles stock-related operations: adjustments, transfers, movements, valuation.
 * Split from inventoryController.ts for better maintainability.
 */

import { Request, Response } from 'express';
import prisma from '../../config/prisma';

// Stock Adjustment
export const adjustStock = async (req: Request, res: Response) => {
    try {
        const {
            productId,
            quantity,
            type,
            reason,
            notes,
            warehouseId
        } = req.body;

        // @ts-ignore
        const companyId = req.user.companyId;
        // @ts-ignore
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

        const previousStock = product.currentStock;
        const newStock = previousStock + quantity;

        if (newStock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: { currentStock: newStock }
        });

        const stockMovement = await prisma.stockMovement.create({
            data: {
                productId,
                type: type || 'ADJUSTMENT',
                quantity,
                previousStock,
                newStock,
                reason,
                notes,
                warehouseId,
                createdBy: userId,
                companyId
            }
        });

        return res.json({
            success: true,
            data: {
                product: updatedProduct,
                movement: stockMovement
            }
        });
    } catch (error: any) {
        console.error('Stock adjustment error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error adjusting stock'
        });
    }
};

// Get Low Stock Products
export const getLowStock = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
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
        console.error('Get low stock error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching low stock products'
        });
    }
};

// Stock Transfer
export const transferStock = async (req: Request, res: Response) => {
    try {
        const {
            productId,
            fromWarehouseId,
            toWarehouseId,
            quantity,
            notes
        } = req.body;

        // @ts-ignore
        const companyId = req.user.companyId;
        // @ts-ignore
        const userId = req.user.id;

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        const product = await prisma.product.findFirst({
            where: { id: productId, companyId }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const previousStock = product.currentStock;

        const [fromWarehouse, toWarehouse] = await Promise.all([
            prisma.warehouse.findFirst({ where: { id: fromWarehouseId, companyId } }),
            prisma.warehouse.findFirst({ where: { id: toWarehouseId, companyId } })
        ]);

        if (!fromWarehouse || !toWarehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found'
            });
        }

        const transferOut = await prisma.stockMovement.create({
            data: {
                productId,
                type: 'TRANSFER_OUT',
                quantity: -quantity,
                previousStock,
                newStock: previousStock,
                warehouseId: fromWarehouseId,
                notes,
                createdBy: userId,
                companyId
            }
        });

        const transferIn = await prisma.stockMovement.create({
            data: {
                productId,
                type: 'TRANSFER_IN',
                quantity,
                previousStock,
                newStock: previousStock,
                warehouseId: toWarehouseId,
                reference: transferOut.id,
                notes,
                createdBy: userId,
                companyId
            }
        });

        return res.json({
            success: true,
            data: {
                transferOut,
                transferIn
            }
        });
    } catch (error: any) {
        console.error('Stock transfer error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error transferring stock'
        });
    }
};

// Get Stock History for Product
export const getStockHistory = async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        // @ts-ignore
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
        console.error('Get stock history error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching stock history'
        });
    }
};

// Create a new batch
export const createBatch = async (req: Request, res: Response) => {
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

        // @ts-ignore
        const companyId = req.user.companyId;
        // @ts-ignore
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
                where: { id: productId },
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
        console.error('Create batch error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error creating batch'
        });
    }
};

// Get batches for a product
export const getBatches = async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        // @ts-ignore
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
        console.error('Get batches error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching batches'
        });
    }
};

// Get All Stock Movements
export const getStockMovements = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
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
        console.error('Get stock movements error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching stock movements'
        });
    }
};

// Inventory Valuation
export const getInventoryValuation = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
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
        console.error('Get inventory valuation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error calculating inventory valuation'
        });
    }
};
