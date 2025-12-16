"use strict";
/**
 * Stock Controller
 *
 * Handles stock-related operations: adjustments, transfers, movements, valuation.
 * Split from inventoryController.ts for better maintainability.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryValuation = exports.getStockMovements = exports.getStockHistory = exports.transferStock = exports.getLowStock = exports.adjustStock = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
// Stock Adjustment
const adjustStock = async (req, res) => {
    try {
        const { productId, quantity, type, reason, notes, warehouseId } = req.body;
        // @ts-ignore
        const companyId = req.user.companyId;
        // @ts-ignore
        const userId = req.user.id;
        const product = await prisma_1.default.product.findFirst({
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
        const updatedProduct = await prisma_1.default.product.update({
            where: { id: productId },
            data: { currentStock: newStock }
        });
        const stockMovement = await prisma_1.default.stockMovement.create({
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
    }
    catch (error) {
        console.error('Stock adjustment error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error adjusting stock'
        });
    }
};
exports.adjustStock = adjustStock;
// Get Low Stock Products
const getLowStock = async (req, res) => {
    try {
        // @ts-ignore
        const companyId = req.user.companyId;
        const lowStockProducts = await prisma_1.default.product.findMany({
            where: {
                companyId,
                isActive: true,
                AND: [
                    {
                        currentStock: {
                            lte: prisma_1.default.product.fields.minStock
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
    }
    catch (error) {
        console.error('Get low stock error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching low stock products'
        });
    }
};
exports.getLowStock = getLowStock;
// Stock Transfer
const transferStock = async (req, res) => {
    try {
        const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;
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
        const product = await prisma_1.default.product.findFirst({
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
            prisma_1.default.warehouse.findFirst({ where: { id: fromWarehouseId, companyId } }),
            prisma_1.default.warehouse.findFirst({ where: { id: toWarehouseId, companyId } })
        ]);
        if (!fromWarehouse || !toWarehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found'
            });
        }
        const transferOut = await prisma_1.default.stockMovement.create({
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
        const transferIn = await prisma_1.default.stockMovement.create({
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
    }
    catch (error) {
        console.error('Stock transfer error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error transferring stock'
        });
    }
};
exports.transferStock = transferStock;
// Get Stock History for Product
const getStockHistory = async (req, res) => {
    try {
        const { productId } = req.params;
        // @ts-ignore
        const companyId = req.user.companyId;
        const movements = await prisma_1.default.stockMovement.findMany({
            where: {
                productId,
                companyId
            },
            include: {
                product: true,
                warehouse: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            success: true,
            data: movements
        });
    }
    catch (error) {
        console.error('Get stock history error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching stock history'
        });
    }
};
exports.getStockHistory = getStockHistory;
// Get All Stock Movements
const getStockMovements = async (req, res) => {
    try {
        // @ts-ignore
        const companyId = req.user.companyId;
        const { type, startDate, endDate, limit = '50' } = req.query;
        const where = { companyId };
        if (type) {
            where.type = type;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const movements = await prisma_1.default.stockMovement.findMany({
            where,
            include: {
                product: true,
                warehouse: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: parseInt(limit)
        });
        res.json({
            success: true,
            data: movements
        });
    }
    catch (error) {
        console.error('Get stock movements error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching stock movements'
        });
    }
};
exports.getStockMovements = getStockMovements;
// Inventory Valuation
const getInventoryValuation = async (req, res) => {
    try {
        // @ts-ignore
        const companyId = req.user.companyId;
        const products = await prisma_1.default.product.findMany({
            where: {
                companyId,
                isActive: true
            }
        });
        let totalValue = 0;
        const breakdown = [];
        const categoryMap = new Map();
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
    }
    catch (error) {
        console.error('Get inventory valuation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error calculating inventory valuation'
        });
    }
};
exports.getInventoryValuation = getInventoryValuation;
//# sourceMappingURL=stockController.js.map