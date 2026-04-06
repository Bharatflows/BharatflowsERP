/**
 * Inventory Valuation Service
 * 
 * P1: FIFO and Weighted Average costing methods
 */

import prisma from '../config/prisma';

export type ValuationMethod = 'AVERAGE' | 'FIFO' | 'LIFO';

interface ValuationResult {
    unitCost: number;
    totalValue: number;
    layers?: CostLayer[];
}

interface CostLayer {
    quantity: number;
    unitCost: number;
    date: Date;
    batchNumber?: string;
}

class ValuationService {
    /**
     * Get the current valuation method for a company
     */
    async getCompanyValuationMethod(companyId: string): Promise<ValuationMethod> {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { valuationMethod: true }
        });
        return (company?.valuationMethod as ValuationMethod) || 'AVERAGE';
    }

    /**
     * Calculate inventory value using Weighted Average method
     * Formula: Total Value / Total Quantity
     */
    async calculateWeightedAverage(productId: string, companyId: string): Promise<ValuationResult> {
        // Get all purchase/incoming movements
        const movements = await prisma.stockMovement.findMany({
            where: {
                productId,
                product: { companyId },
                type: { in: ['PURCHASE', 'OPENING', 'TRANSFER_IN', 'ADJUSTMENT'] },
                quantity: { gt: 0 }
            },
            include: {
                product: true,
                batch: true // Include batch for cost price
            }
        });

        // Calculate total quantity and value
        let totalQuantity = 0;
        let totalValue = 0;

        for (const movement of movements) {
            const cost = Number(movement.batch?.costPrice) || Number(movement.product?.purchasePrice) || 0;
            totalQuantity += Math.abs(movement.quantity);
            totalValue += Math.abs(movement.quantity) * cost;
        }

        const unitCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

        return {
            unitCost: Math.round(unitCost * 100) / 100,
            totalValue: Math.round(totalValue * 100) / 100
        };
    }

    /**
     * Calculate inventory value using FIFO method
     * First In, First Out - oldest stock sold first
     */
    async calculateFIFO(productId: string, companyId: string): Promise<ValuationResult> {
        // Get all movements ordered by date
        const incomingMovements = await prisma.stockMovement.findMany({
            where: {
                productId,
                product: { companyId },
                type: { in: ['PURCHASE', 'OPENING', 'TRANSFER_IN', 'ADJUSTMENT'] },
                quantity: { gt: 0 }
            },
            orderBy: { createdAt: 'asc' },
            include: {
                product: true,
                batch: true
            }
        });

        const outgoingMovements = await prisma.stockMovement.findMany({
            where: {
                productId,
                product: { companyId },
                type: { in: ['SALE', 'TRANSFER_OUT', 'DAMAGE', 'WRITE_OFF'] },
                quantity: { not: 0 }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Create cost layers from incoming
        const layers: CostLayer[] = incomingMovements.map(m => ({
            quantity: Math.abs(m.quantity),
            unitCost: Number(m.batch?.costPrice) || Number(m.product?.purchasePrice) || 0,
            date: m.createdAt,
            batchNumber: m.batch?.batchNumber || undefined
        }));

        // Consume layers based on outgoing (FIFO - oldest first)
        let totalOutgoing = outgoingMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0);

        for (const layer of layers) {
            if (totalOutgoing <= 0) break;

            const consumed = Math.min(layer.quantity, totalOutgoing);
            layer.quantity -= consumed;
            totalOutgoing -= consumed;
        }

        // Remove depleted layers
        const remainingLayers = layers.filter(l => l.quantity > 0);

        // Calculate current value
        let totalValue = 0;
        let totalQuantity = 0;

        for (const layer of remainingLayers) {
            totalValue += layer.quantity * layer.unitCost;
            totalQuantity += layer.quantity;
        }

        return {
            unitCost: totalQuantity > 0 ? Math.round((totalValue / totalQuantity) * 100) / 100 : 0,
            totalValue: Math.round(totalValue * 100) / 100,
            layers: remainingLayers
        };
    }

    /**
     * Calculate inventory value using LIFO method (less common in India)
     * Last In, First Out - newest stock sold first
     */
    async calculateLIFO(productId: string, companyId: string): Promise<ValuationResult> {
        const incomingMovements = await prisma.stockMovement.findMany({
            where: {
                productId,
                product: { companyId },
                type: { in: ['PURCHASE', 'OPENING', 'TRANSFER_IN', 'ADJUSTMENT'] },
                quantity: { gt: 0 }
            },
            orderBy: { createdAt: 'desc' }, // Latest first for LIFO
            include: {
                product: true,
                batch: true
            }
        });

        const outgoingMovements = await prisma.stockMovement.findMany({
            where: {
                productId,
                product: { companyId },
                type: { in: ['SALE', 'TRANSFER_OUT', 'DAMAGE', 'WRITE_OFF'] }
            }
        });

        const layers: CostLayer[] = incomingMovements.map(m => ({
            quantity: Math.abs(m.quantity),
            unitCost: Number(m.batch?.costPrice) || Number(m.product?.purchasePrice) || 0,
            date: m.createdAt,
            batchNumber: m.batch?.batchNumber || undefined
        }));

        // Consume layers based on outgoing (LIFO - newest first)
        let totalOutgoing = outgoingMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0);

        for (const layer of layers) {
            if (totalOutgoing <= 0) break;

            const consumed = Math.min(layer.quantity, totalOutgoing);
            layer.quantity -= consumed;
            totalOutgoing -= consumed;
        }

        const remainingLayers = layers.filter(l => l.quantity > 0);

        let totalValue = 0;
        let totalQuantity = 0;

        for (const layer of remainingLayers) {
            totalValue += layer.quantity * layer.unitCost;
            totalQuantity += layer.quantity;
        }

        return {
            unitCost: totalQuantity > 0 ? Math.round((totalValue / totalQuantity) * 100) / 100 : 0,
            totalValue: Math.round(totalValue * 100) / 100,
            layers: remainingLayers
        };
    }

    /**
     * Get current inventory valuation based on company's preferred method
     */
    async getInventoryValuation(productId: string, companyId: string): Promise<ValuationResult> {
        const method = await this.getCompanyValuationMethod(companyId);

        switch (method) {
            case 'FIFO':
                return this.calculateFIFO(productId, companyId);
            case 'LIFO':
                return this.calculateLIFO(productId, companyId);
            case 'AVERAGE':
            default:
                return this.calculateWeightedAverage(productId, companyId);
        }
    }

    /**
     * Calculate Cost of Goods Sold (COGS) for a sale
     */
    async calculateCOGS(
        productId: string,
        companyId: string,
        quantity: number
    ): Promise<number> {
        const valuation = await this.getInventoryValuation(productId, companyId);
        return Math.round(quantity * valuation.unitCost * 100) / 100;
    }

    /**
     * Get total inventory value for a company
     */
    async getTotalInventoryValue(companyId: string): Promise<{
        totalValue: number;
        productCount: number;
        method: ValuationMethod;
    }> {
        const products = await prisma.product.findMany({
            where: { companyId, isActive: true },
            select: { id: true }
        });

        let totalValue = 0;

        for (const product of products) {
            const valuation = await this.getInventoryValuation(product.id, companyId);
            totalValue += valuation.totalValue;
        }

        return {
            totalValue: Math.round(totalValue * 100) / 100,
            productCount: products.length,
            method: await this.getCompanyValuationMethod(companyId)
        };
    }
}

export default new ValuationService();
