/**
 * Stock Validation Service
 * 
 * P1: Negative stock prevention with company-level configuration
 */

import prisma from '../config/prisma';

interface StockValidationResult {
    isValid: boolean;
    message?: string;
    currentStock: number;
    requestedQuantity: number;
    resultingStock: number;
}

interface CompanyStockSettings {
    allowNegativeStock: boolean;
    warnAtLowStock: boolean;
    lowStockThreshold: number;
}

class StockValidationService {
    /**
     * Get stock settings for a company
     */
    async getCompanyStockSettings(companyId: string): Promise<CompanyStockSettings> {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { features: true }
        });

        // Read from company features JSON or use defaults
        const features = (company?.features as any) || {};

        return {
            allowNegativeStock: features.allowNegativeStock || false,
            warnAtLowStock: features.warnAtLowStock !== false, // Default true
            lowStockThreshold: features.lowStockThreshold || 10
        };
    }

    /**
     * Validate if stock can be reduced
     */
    async validateStockReduction(
        productId: string,
        companyId: string,
        requestedQuantity: number,
        warehouseId?: string
    ): Promise<StockValidationResult> {
        // Get product current stock
        const product = await prisma.product.findFirst({
            where: { id: productId, companyId },
            select: {
                id: true,
                name: true,
                currentStock: true,
                reorderLevel: true
            }
        });

        if (!product) {
            return {
                isValid: false,
                message: 'Product not found',
                currentStock: 0,
                requestedQuantity,
                resultingStock: -requestedQuantity
            };
        }

        // If warehouse-specific, get warehouse stock
        let currentStock = product.currentStock;

        if (warehouseId) {
            const warehouseStock = await this.getWarehouseStock(productId, warehouseId);
            currentStock = warehouseStock;
        }

        const resultingStock = currentStock - requestedQuantity;
        const settings = await this.getCompanyStockSettings(companyId);

        // Check if resulting stock would be negative
        if (resultingStock < 0 && !settings.allowNegativeStock) {
            return {
                isValid: false,
                message: `Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${requestedQuantity}`,
                currentStock,
                requestedQuantity,
                resultingStock
            };
        }

        return {
            isValid: true,
            currentStock,
            requestedQuantity,
            resultingStock
        };
    }

    /**
     * Validate multiple items at once (for invoices, orders, etc.)
     */
    async validateMultipleItems(
        items: Array<{ productId: string; quantity: number; warehouseId?: string }>,
        companyId: string
    ): Promise<{ isValid: boolean; errors: string[] }> {
        const errors: string[] = [];

        for (const item of items) {
            const result = await this.validateStockReduction(
                item.productId,
                companyId,
                item.quantity,
                item.warehouseId
            );

            if (!result.isValid && result.message) {
                errors.push(result.message);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get stock quantity in a specific warehouse
     */
    async getWarehouseStock(productId: string, warehouseId: string): Promise<number> {
        const aggregate = await prisma.stockMovement.aggregate({
            where: {
                productId,
                warehouseId
            },
            _sum: {
                quantity: true
            }
        });

        return aggregate._sum.quantity || 0;
    }

    /**
     * Get low stock products
     */
    async getLowStockProducts(companyId: string): Promise<any[]> {
        const settings = await this.getCompanyStockSettings(companyId);

        const products = await prisma.product.findMany({
            where: {
                companyId,
                isActive: true,
                currentStock: {
                    lte: settings.lowStockThreshold
                }
            },
            select: {
                id: true,
                name: true,
                currentStock: true,
                reorderLevel: true,
                unit: true
            },
            orderBy: {
                currentStock: 'asc'
            }
        });

        return products.map(p => ({
            ...p,
            isNegative: p.currentStock < 0,
            isCritical: p.currentStock <= (p.reorderLevel || 0),
            shortage: (p.reorderLevel || settings.lowStockThreshold) - p.currentStock
        }));
    }

    /**
     * Check if company allows negative stock
     */
    async allowsNegativeStock(companyId: string): Promise<boolean> {
        const settings = await this.getCompanyStockSettings(companyId);
        return settings.allowNegativeStock;
    }
}

export default new StockValidationService();
