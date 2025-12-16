"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProduct = exports.getProductById = exports.getProducts = exports.createProduct = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const createProduct = async (req, res) => {
    try {
        const { name, code, hsnCode, description, unit, purchasePrice, sellingPrice, mrp, gstRate, currentStock, minStock, maxStock, reorderPoint, // mapped to reorderLevel
        category, barcode, location, taxInclusive, trackInventory, sellWithoutStock } = req.body;
        // @ts-ignore
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
                sellWithoutStock: sellWithoutStock || false,
                companyId
            }
        });
        res.status(201).json({
            success: true,
            data: product
        });
    }
    catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating product'
        });
    }
};
exports.createProduct = createProduct;
const getProducts = async (req, res) => {
    try {
        // @ts-ignore
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
        console.error('Get products error:', error);
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
        // @ts-ignore
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
        console.error('Get product error:', error);
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
        // @ts-ignore
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
        category, barcode, location, taxInclusive, trackInventory, sellWithoutStock, isActive } = data;
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
        res.json({
            success: true,
            data: updatedProduct
        });
    }
    catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating product'
        });
    }
};
exports.updateProduct = updateProduct;
//# sourceMappingURL=productsController.js.map