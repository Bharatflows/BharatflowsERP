"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductByBarcode = exports.updateProduct = exports.getProductById = exports.getProducts = exports.createProduct = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const auditService_1 = require("../services/auditService");
const eventBus_1 = __importStar(require("../services/eventBus")); // P0: Domain events
const logger_1 = __importDefault(require("../config/logger"));
const createProduct = async (req, res) => {
    try {
        const { name, code, hsnCode, description, unit, purchasePrice, sellingPrice, mrp, gstRate, currentStock, minStock, maxStock, reorderPoint, // mapped to reorderLevel
        category, barcode, location, taxInclusive, trackInventory, isBatchTracked, isSerialTracked, sellWithoutStock } = req.body;
        const companyId = req.user.companyId;
        const product = await prisma_1.default.product.create({
            data: {
                name,
                code,
                hsnCode,
                description,
                unit: unit || 'pcs',
                purchasePrice: parseFloat(purchasePrice) || 0,
                sellingPrice: parseFloat(sellingPrice) || 0,
                mrp: parseFloat(mrp) || 0,
                gstRate: parseFloat(gstRate) || 0,
                currentStock: parseInt(currentStock) || 0,
                minStock: parseInt(minStock) || 0,
                maxStock: parseInt(maxStock) || 0,
                reorderLevel: parseInt(reorderPoint) || 0,
                category,
                barcode,
                location,
                taxInclusive: taxInclusive || false,
                trackInventory: trackInventory !== undefined ? trackInventory : true,
                isBatchTracked: isBatchTracked || false,
                isSerialTracked: isSerialTracked || false,
                sellWithoutStock: sellWithoutStock || false,
                companyId
            }
        });
        // Audit Log
        await auditService_1.AuditService.logChange(companyId, req.user.id, 'PRODUCT', product.id, 'CREATE', null, product, req.ip, req.headers['user-agent'] || 'UNKNOWN', 'INVENTORY');
        // P0: Emit domain event for cross-domain processing
        try {
            await eventBus_1.default.emit({
                companyId,
                eventType: eventBus_1.EventTypes.PRODUCT_CREATED,
                aggregateType: 'Product',
                aggregateId: product.id,
                payload: {
                    productId: product.id,
                    name: product.name,
                    code: product.code,
                    currentStock: product.currentStock,
                    sellingPrice: Number(product.sellingPrice),
                    purchasePrice: Number(product.purchasePrice)
                },
                metadata: {
                    userId: req.user.id,
                    source: 'api'
                }
            });
        }
        catch (eventError) {
            logger_1.default.warn('Failed to emit PRODUCT_CREATED event:', eventError);
        }
        res.status(201).json({
            success: true,
            data: product
        });
    }
    catch (error) {
        logger_1.default.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating product'
        });
    }
};
exports.createProduct = createProduct;
const getProducts = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const products = await prisma_1.default.product.findMany({
            where: {
                companyId,
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.json({
            success: true,
            data: products
        });
    }
    catch (error) {
        logger_1.default.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching products'
        });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const product = await prisma_1.default.product.findFirst({
            where: {
                id,
                companyId
            }
        });
        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found'
            });
            return;
        }
        res.json({
            success: true,
            data: product
        });
    }
    catch (error) {
        logger_1.default.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching product'
        });
    }
};
exports.getProductById = getProductById;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const data = req.body;
        const product = await prisma_1.default.product.findFirst({
            where: { id, companyId }
        });
        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found'
            });
            return;
        }
        // Explicitly pick only the fields that exist in the Prisma schema
        const { name, sku, // We'll map this to code
        code, hsnCode, description, unit, purchasePrice, salePrice, // We'll map this to sellingPrice
        sellingPrice, mrp, gstRate, currentStock, minStock, maxStock, reorderPoint, // mapped to reorderLevel
        category, barcode, location, taxInclusive, trackInventory, isBatchTracked, isSerialTracked, sellWithoutStock, isActive } = data;
        const updateData = {
            name,
            hsnCode,
            description,
            unit,
            category,
            barcode,
            location,
            taxInclusive,
            trackInventory,
            isBatchTracked,
            isSerialTracked,
            sellWithoutStock,
            isActive,
            updatedAt: new Date()
        };
        // Handle numeric fields
        if (purchasePrice !== undefined)
            updateData.purchasePrice = parseFloat(purchasePrice);
        if (mrp !== undefined)
            updateData.mrp = parseFloat(mrp);
        if (gstRate !== undefined)
            updateData.gstRate = parseFloat(gstRate);
        if (currentStock !== undefined)
            updateData.currentStock = parseInt(currentStock);
        if (minStock !== undefined)
            updateData.minStock = parseInt(minStock);
        if (maxStock !== undefined)
            updateData.maxStock = parseInt(maxStock);
        // Handle field mappings
        if (code)
            updateData.code = code;
        if (sku)
            updateData.code = sku;
        if (reorderPoint !== undefined)
            updateData.reorderLevel = parseInt(reorderPoint);
        if (sellingPrice !== undefined)
            updateData.sellingPrice = parseFloat(sellingPrice);
        else if (salePrice !== undefined)
            updateData.sellingPrice = parseFloat(salePrice);
        const updatedProduct = await prisma_1.default.product.update({
            where: { id },
            data: updateData
        });
        // Audit Log
        await auditService_1.AuditService.logChange(companyId, req.user.id, 'PRODUCT', id, 'UPDATE', product, updatedProduct, req.ip, req.headers['user-agent'] || 'UNKNOWN', 'INVENTORY');
        // P0: Emit domain event for cross-domain processing
        try {
            await eventBus_1.default.emit({
                companyId,
                eventType: eventBus_1.EventTypes.PRODUCT_UPDATED,
                aggregateType: 'Product',
                aggregateId: id,
                payload: {
                    productId: id,
                    name: updatedProduct.name,
                    code: updatedProduct.code,
                    currentStock: updatedProduct.currentStock,
                    sellingPrice: Number(updatedProduct.sellingPrice),
                    purchasePrice: Number(updatedProduct.purchasePrice),
                    changes: Object.keys(updateData)
                },
                metadata: {
                    userId: req.user.id,
                    source: 'api'
                }
            });
        }
        catch (eventError) {
            logger_1.default.warn('Failed to emit PRODUCT_UPDATED event:', eventError);
        }
        res.json({
            success: true,
            data: updatedProduct
        });
    }
    catch (error) {
        logger_1.default.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating product'
        });
    }
};
exports.updateProduct = updateProduct;
const getProductByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;
        const companyId = req.user.companyId;
        const product = await prisma_1.default.product.findFirst({
            where: {
                barcode,
                companyId,
                isActive: true
            }
        });
        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product with this barcode not found'
            });
            return;
        }
        res.json({
            success: true,
            data: product
        });
    }
    catch (error) {
        logger_1.default.error('Get product by barcode error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching product'
        });
    }
};
exports.getProductByBarcode = getProductByBarcode;
//# sourceMappingURL=productsController.js.map