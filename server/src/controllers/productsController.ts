import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';

export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const {
            name,
            code,
            hsnCode,
            description,
            unit,
            purchasePrice,
            sellingPrice,
            mrp,
            gstRate,
            currentStock,
            minStock,
            maxStock,
            reorderPoint, // mapped to reorderLevel
            category,
            barcode,
            location,
            taxInclusive,
            trackInventory,
            isBatchTracked,
            isSerialTracked,
            sellWithoutStock
        } = req.body;

        const companyId = req.user.companyId;

        const product = await prisma.product.create({
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
        await AuditService.logChange(
            companyId,
            req.user.id,
            'PRODUCT',
            product.id,
            'CREATE',
            null,
            product,
            req.ip,
            req.headers['user-agent'] || 'UNKNOWN',
            'INVENTORY'
        );

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error: any) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating product'
        });
    }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;

        const products = await prisma.product.findMany({
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
    } catch (error: any) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching products'
        });
    }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const product = await prisma.product.findFirst({
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
    } catch (error: any) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching product'
        });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const data = req.body;

        const product = await prisma.product.findFirst({
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
        const {
            name,
            sku, // We'll map this to code
            code,
            hsnCode,
            description,
            unit,
            purchasePrice,
            salePrice, // We'll map this to sellingPrice
            sellingPrice,
            mrp,
            gstRate,
            currentStock,
            minStock,
            maxStock,
            reorderPoint, // mapped to reorderLevel
            category,
            barcode,
            location,
            taxInclusive,
            trackInventory,
            isBatchTracked,
            isSerialTracked,
            sellWithoutStock,
            isActive
        } = data;

        const updateData: any = {
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
        if (purchasePrice !== undefined) updateData.purchasePrice = parseFloat(purchasePrice);
        if (mrp !== undefined) updateData.mrp = parseFloat(mrp);
        if (gstRate !== undefined) updateData.gstRate = parseFloat(gstRate);
        if (currentStock !== undefined) updateData.currentStock = parseInt(currentStock);
        if (minStock !== undefined) updateData.minStock = parseInt(minStock);
        if (maxStock !== undefined) updateData.maxStock = parseInt(maxStock);

        // Handle field mappings
        if (code) updateData.code = code;
        if (sku) updateData.code = sku;
        if (reorderPoint !== undefined) updateData.reorderLevel = parseInt(reorderPoint);

        if (sellingPrice !== undefined) updateData.sellingPrice = parseFloat(sellingPrice);
        else if (salePrice !== undefined) updateData.sellingPrice = parseFloat(salePrice);

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: updateData
        });

        // Audit Log
        await AuditService.logChange(
            companyId,
            req.user.id,
            'PRODUCT',
            id,
            'UPDATE',
            product,
            updatedProduct,
            req.ip,
            req.headers['user-agent'] || 'UNKNOWN',
            'INVENTORY'
        );

        res.json({
            success: true,
            data: updatedProduct
        });
    } catch (error: any) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating product'
        });
    }
};
