/**
 * BOM Explosion Service
 * 
 * Handles Bill of Material operations for manufacturing MSMEs:
 * - Explode BOM to get raw material requirements
 * - Auto-deduct raw materials on sale of finished goods
 * - Calculate product cost based on BOM (FIFO/Weighted Average)
 * - Record wastage during production
 */

import prisma from '../config/prisma';
import logger from '../config/logger';

// Types for BOM operations
interface BOMExplosionItem {
    productId: string;
    productName: string;
    productCode: string | null;
    requiredQuantity: number;
    unit: string | null;
    availableStock: number;
    shortfall: number;
}

interface InvoiceItemForDeduction {
    productId: string;
    quantity: number;
}

interface DeductionResult {
    success: boolean;
    productId: string;
    productName: string;
    deductions: Array<{
        rawMaterialId: string;
        rawMaterialName: string;
        quantityDeducted: number;
        unit: string;
    }>;
    errors: string[];
}

interface WastageEntry {
    productId: string;
    quantity: number;
    unit: string;
    reason: 'EXPIRED' | 'DAMAGED' | 'PRODUCTION_LOSS' | 'SPILLAGE' | 'QC_REJECT' | 'OTHER';
    workOrderId?: string;
    batchId?: string;
    notes?: string;
}

/**
 * Explodes a BOM to get flat list of required raw materials
 * Supports multi-level BOMs (raw materials that themselves have BOMs)
 */
export async function explodeBOM(
    bomId: string,
    quantity: number = 1,
    companyId: string
): Promise<BOMExplosionItem[]> {
    const bom = await prisma.billOfMaterial.findUnique({
        where: { id: bomId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
            finishedProduct: true,
        },
    });

    if (!bom) {
        throw new Error(`BOM not found: ${bomId}`);
    }

    const outputQuantity = Number(bom.outputQuantity) || 1;
    const multiplier = quantity / outputQuantity;

    const explosionItems: BOMExplosionItem[] = [];

    for (const item of bom.items) {
        const requiredQty = Number(item.quantity) * multiplier;
        const product = item.product;
        const availableStock = product.currentStock || 0;

        // Check if this raw material itself has a BOM (multi-level)
        const subBOM = await prisma.billOfMaterial.findFirst({
            where: {
                finishedProductId: item.productId,
                companyId,
                isActive: true,
            },
        });

        if (subBOM) {
            // Recursive explosion for sub-assemblies
            const subItems = await explodeBOM(subBOM.id, requiredQty, companyId);
            explosionItems.push(...subItems);
        } else {
            // Leaf-level raw material
            explosionItems.push({
                productId: product.id,
                productName: product.name,
                productCode: product.code,
                requiredQuantity: requiredQty,
                unit: item.unit,
                availableStock,
                shortfall: Math.max(0, requiredQty - availableStock),
            });
        }
    }

    // Consolidate duplicate materials (can happen with multi-level BOMs)
    const consolidated = new Map<string, BOMExplosionItem>();
    for (const item of explosionItems) {
        const existing = consolidated.get(item.productId);
        if (existing) {
            existing.requiredQuantity += item.requiredQuantity;
            existing.shortfall = Math.max(0, existing.requiredQuantity - existing.availableStock);
        } else {
            consolidated.set(item.productId, { ...item });
        }
    }

    return Array.from(consolidated.values());
}

/**
 * Deducts raw materials when finished goods are sold
 * Called after invoice creation for products with BOMs
 * 
 * Phase 9.2: Idempotency - Checks for existing deductions before processing
 */
export async function deductStockOnSale(
    invoiceItems: InvoiceItemForDeduction[],
    companyId: string,
    userId: string,
    invoiceNumber: string
): Promise<DeductionResult[]> {
    const results: DeductionResult[] = [];

    for (const invoiceItem of invoiceItems) {
        const result: DeductionResult = {
            success: true,
            productId: invoiceItem.productId,
            productName: '',
            deductions: [],
            errors: [],
        };

        // Phase 9.2: Idempotency Check - Skip if already processed for this invoice
        const existingDeduction = await prisma.stockMovement.findFirst({
            where: {
                reference: invoiceNumber,
                type: 'BOM_DEDUCTION',
                companyId,
                reason: { contains: invoiceItem.productId }
            }
        });

        if (existingDeduction) {
            logger.info(`Skipping BOM deduction for ${invoiceItem.productId} - already processed for ${invoiceNumber}`);
            continue;
        }

        // Check if product has a BOM
        const bom = await prisma.billOfMaterial.findFirst({
            where: {
                finishedProductId: invoiceItem.productId,
                companyId,
                isActive: true,
            },
            include: {
                finishedProduct: true,
            },
        });

        if (!bom) {
            // No BOM - skip (regular product, not manufactured)
            continue;
        }

        result.productName = bom.finishedProduct.name;

        try {
            // Explode BOM to get required materials
            const requiredMaterials = await explodeBOM(
                bom.id,
                invoiceItem.quantity,
                companyId
            );

            // Deduct each raw material
            for (const material of requiredMaterials) {
                // Get current stock
                const product = await prisma.product.findUnique({
                    where: { id: material.productId, companyId },
                });

                if (!product) {
                    result.errors.push(`Product not found: ${material.productId}`);
                    result.success = false;
                    continue;
                }

                const currentStock = product.currentStock || 0;
                const deductQty = Math.floor(material.requiredQuantity);

                if (currentStock < deductQty && !product.sellWithoutStock) {
                    result.errors.push(
                        `Insufficient stock for ${product.name}: need ${deductQty}, have ${currentStock}`
                    );
                    result.success = false;
                    continue;
                }

                // Deduct stock
                await prisma.product.update({
                    where: { id: material.productId, companyId },
                    data: {
                        currentStock: { decrement: deductQty },
                    },
                });

                // Create stock movement record
                await prisma.stockMovement.create({
                    data: {
                        type: 'BOM_DEDUCTION',
                        quantity: -deductQty,
                        previousStock: currentStock,
                        newStock: currentStock - deductQty,
                        reference: invoiceNumber,
                        reason: `Auto-deducted for sale of ${bom.finishedProduct.name}`,
                        productId: material.productId,
                        createdBy: userId,
                        companyId,
                    },
                });

                result.deductions.push({
                    rawMaterialId: material.productId,
                    rawMaterialName: material.productName,
                    quantityDeducted: deductQty,
                    unit: material.unit || product.unit,
                });
            }

            logger.info(`BOM deduction completed for ${result.productName}`, {
                invoiceNumber,
                deductionsCount: result.deductions.length,
            });
        } catch (error: any) {
            result.success = false;
            result.errors.push(error.message);
            logger.error('BOM deduction failed', { error: error.message, productId: invoiceItem.productId });
        }

        results.push(result);
    }

    return results;
}

/**
 * Calculate the cost of producing a finished product based on its BOM
 * Uses FIFO or Weighted Average based on company settings
 */
export async function calculateBOMCost(
    bomId: string,
    companyId: string
): Promise<{
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    breakdown: Array<{ productName: string; quantity: number; unitCost: number; totalCost: number }>;
}> {
    const bom = await prisma.billOfMaterial.findUnique({
        where: { id: bomId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    if (!bom) {
        throw new Error(`BOM not found: ${bomId}`);
    }

    // Get company valuation method
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { valuationMethod: true },
    });

    const valuationMethod = company?.valuationMethod || 'AVERAGE';

    let materialCost = 0;
    const breakdown: Array<{ productName: string; quantity: number; unitCost: number; totalCost: number }> = [];

    for (const item of bom.items) {
        const product = item.product;
        const quantity = Number(item.quantity);
        let unitCost = 0;

        if (valuationMethod === 'FIFO') {
            // Get oldest batch cost
            const oldestBatch = await prisma.stockBatch.findFirst({
                where: {
                    productId: product.id,
                    quantity: { gt: 0 },
                    isActive: true,
                },
                orderBy: { createdAt: 'asc' },
            });
            unitCost = oldestBatch?.costPrice ? Number(oldestBatch.costPrice) : Number(product.purchasePrice);
        } else {
            // Weighted Average - use product purchase price
            unitCost = Number(product.purchasePrice);
        }

        const lineCost = quantity * unitCost;
        materialCost += lineCost;

        breakdown.push({
            productName: product.name,
            quantity,
            unitCost,
            totalCost: lineCost,
        });
    }

    const laborCost = Number(bom.laborCost) || 0;
    const overheadCost = Number(bom.overheadCost) || 0;
    const totalCost = materialCost + laborCost + overheadCost;

    return {
        materialCost,
        laborCost,
        overheadCost,
        totalCost,
        breakdown,
    };
}

/**
 * Record wastage during production or due to expiry/damage
 */
export async function recordWastage(
    entry: WastageEntry,
    companyId: string,
    userId: string
): Promise<{ success: boolean; wastageId: string; message: string }> {
    const product = await prisma.product.findUnique({
        where: { id: entry.productId, companyId },
    });

    if (!product) {
        throw new Error(`Product not found: ${entry.productId}`);
    }

    // Calculate cost impact
    let unitCost = Number(product.purchasePrice) || 0;

    // If batch specified, use batch cost
    if (entry.batchId) {
        const batch = await prisma.stockBatch.findUnique({
            where: { id: entry.batchId },
        });
        if (batch?.costPrice) {
            unitCost = Number(batch.costPrice);
        }
    }

    const totalCost = entry.quantity * unitCost;

    // Create wastage log
    const wastage = await prisma.wastageLog.create({
        data: {
            companyId,
            productId: entry.productId,
            batchId: entry.batchId,
            quantity: entry.quantity,
            unit: entry.unit,
            reason: entry.reason,
            workOrderId: entry.workOrderId,
            unitCost,
            totalCost,
            notes: entry.notes,
            recordedBy: userId,
        },
    });

    // Deduct stock
    await prisma.product.update({
        where: { id: entry.productId, companyId },
        data: {
            currentStock: { decrement: Math.floor(entry.quantity) },
        },
    });

    // If batch specified, deduct from batch
    if (entry.batchId) {
        await prisma.stockBatch.update({
            where: { id: entry.batchId },
            data: {
                quantity: { decrement: Math.floor(entry.quantity) },
            },
        });
    }

    // Create stock movement
    await prisma.stockMovement.create({
        data: {
            type: 'WASTAGE',
            quantity: -Math.floor(entry.quantity),
            previousStock: product.currentStock,
            newStock: product.currentStock - Math.floor(entry.quantity),
            reference: wastage.id,
            reason: `Wastage: ${entry.reason}`,
            productId: entry.productId,
            createdBy: userId,
            companyId,
            batchId: entry.batchId,
        },
    });

    logger.info('Wastage recorded', {
        wastageId: wastage.id,
        productId: entry.productId,
        quantity: entry.quantity,
        reason: entry.reason,
        totalCost,
    });

    return {
        success: true,
        wastageId: wastage.id,
        message: `Recorded wastage of ${entry.quantity} ${entry.unit} of ${product.name}`,
    };
}

/**
 * Get wastage summary for a period
 */
export async function getWastageSummary(
    companyId: string,
    startDate: Date,
    endDate: Date
): Promise<{
    totalWastage: number;
    totalCost: number;
    byReason: Record<string, { count: number; quantity: number; cost: number }>;
    topProducts: Array<{ productId: string; productName: string; quantity: number; cost: number }>;
}> {
    const wastages = await prisma.wastageLog.findMany({
        where: {
            companyId,
            recordedAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            product: { select: { id: true, name: true } },
        },
    });

    const byReason: Record<string, { count: number; quantity: number; cost: number }> = {};
    const byProduct: Record<string, { productName: string; quantity: number; cost: number }> = {};

    let totalWastage = 0;
    let totalCost = 0;

    for (const w of wastages) {
        const qty = Number(w.quantity);
        const cost = Number(w.totalCost) || 0;

        totalWastage += qty;
        totalCost += cost;

        // By reason
        if (!byReason[w.reason]) {
            byReason[w.reason] = { count: 0, quantity: 0, cost: 0 };
        }
        byReason[w.reason].count++;
        byReason[w.reason].quantity += qty;
        byReason[w.reason].cost += cost;

        // By product
        if (!byProduct[w.productId]) {
            byProduct[w.productId] = { productName: w.product.name, quantity: 0, cost: 0 };
        }
        byProduct[w.productId].quantity += qty;
        byProduct[w.productId].cost += cost;
    }

    // Sort products by cost (highest first)
    const topProducts = Object.entries(byProduct)
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10);

    return {
        totalWastage,
        totalCost,
        byReason,
        topProducts,
    };
}

export default {
    explodeBOM,
    deductStockOnSale,
    calculateBOMCost,
    recordWastage,
    getWastageSummary,
};
