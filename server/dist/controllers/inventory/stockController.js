"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryValuation = exports.getStockMovements = exports.getBatches = exports.createBatch = exports.getStockHistory = exports.transferStock = exports.getLowStock = exports.adjustStock = void 0;
const stockService_1 = require("../../services/stockService");
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../config/logger"));
// Stock Adjustment
const adjustStock = async (req, res) => {
    try {
        const { productId, quantity, type, reason, notes, warehouseId } = req.body;
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const result = await stockService_1.stockService.adjustStock({
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
    }
    catch (error) {
        logger_1.default.error('Stock adjustment error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error adjusting stock'
        });
    }
};
exports.adjustStock = adjustStock;
// Get Low Stock Products (Logic remains in controller as it's a read operation)
const getLowStock = async (req, res) => {
    try {
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
        logger_1.default.error('Get low stock error:', error);
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
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const result = await stockService_1.stockService.transferStock({
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
    }
    catch (error) {
        logger_1.default.error('Stock transfer error:', error);
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
        const companyId = req.user.companyId;
        const movements = await prisma_1.default.stockMovement.findMany({
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
    }
    catch (error) {
        logger_1.default.error('Get stock history error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching stock history'
        });
    }
};
exports.getStockHistory = getStockHistory;
// Create a new batch
const createBatch = async (req, res) => {
    try {
        const { productId, batchNumber, quantity, mfgDate, expiryDate, mrp, costPrice, sellingPrice } = req.body;
        const companyId = req.user.companyId;
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
        const batch = await prisma_1.default.stockBatch.create({
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
            await prisma_1.default.product.update({
                where: { id: productId },
                data: { currentStock: { increment: parseInt(quantity) } }
            });
            // Log movement
            await prisma_1.default.stockMovement.create({
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
    }
    catch (error) {
        logger_1.default.error('Create batch error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error creating batch'
        });
    }
};
exports.createBatch = createBatch;
// Get batches for a product
const getBatches = async (req, res) => {
    try {
        const { productId } = req.params;
        const companyId = req.user.companyId;
        const batches = await prisma_1.default.stockBatch.findMany({
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
    }
    catch (error) {
        logger_1.default.error('Get batches error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching batches'
        });
    }
};
exports.getBatches = getBatches;
// Get All Stock Movements
const getStockMovements = async (req, res) => {
    try {
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
        logger_1.default.error('Get stock movements error:', error);
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
        logger_1.default.error('Get inventory valuation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error calculating inventory valuation'
        });
    }
};
exports.getInventoryValuation = getInventoryValuation;
//# sourceMappingURL=stockController.js.map