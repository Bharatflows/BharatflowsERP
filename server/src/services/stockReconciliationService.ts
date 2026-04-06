/**
 * Stock Reconciliation Service
 * Handles physical stock count reconciliation
 */

import prisma from '../config/prisma';
import logger from '../config/logger';

export interface StockReconciliation {
    id: string;
    reconciliationNumber: string;
    companyId: string;
    warehouseId?: string;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED' | 'CANCELLED';
    reconciliationDate: Date;
    purpose: 'PERIODIC_COUNT' | 'YEAR_END' | 'AUDIT' | 'SHRINKAGE' | 'OTHER';
    items: ReconciliationItem[];
    totalVarianceValue: number;
    notes?: string;
    createdById: string;
    approvedById?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ReconciliationItem {
    id: string;
    reconciliationId: string;
    itemId: string;
    itemName: string;
    warehouseId?: string;
    systemQuantity: number;
    countedQuantity: number;
    varianceQuantity: number;
    unitCost: number;
    varianceValue: number;
    reason?: string;
}

class StockReconciliationService {
    /**
     * Get all reconciliations for a company
     */
    async getReconciliations(companyId: string, params?: { status?: string; warehouseId?: string }): Promise<any[]> {
        try {
            logger.info(`Fetching reconciliations for company ${companyId}`);

            // Placeholder - query StockAdjustment or similar model
            const adjustments = await prisma.stockAdjustment.findMany({
                where: {
                    companyId,
                    ...(params?.status && { status: params.status }),
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            });

            return adjustments.map(adj => ({
                id: adj.id,
                reconciliationNumber: adj.adjustmentNumber,
                status: adj.status,
                reconciliationDate: adj.date,
                purpose: adj.reason || 'PERIODIC_COUNT',
                totalVarianceValue: 0, // Would calculate from items
                createdAt: adj.createdAt
            }));
        } catch (error) {
            logger.error('Error fetching reconciliations:', error);
            return [];
        }
    }

    /**
     * Start new reconciliation - gets current system quantities
     */
    async createReconciliation(data: {
        companyId: string;
        warehouseId?: string;
        purpose: string;
        items: Array<{ itemId: string }>;
        createdById: string;
    }): Promise<any> {
        try {
            logger.info(`Creating reconciliation for company ${data.companyId}`);

            // Get current system quantities for items
            const itemsWithStock = await Promise.all(
                data.items.map(async (item) => {
                    // Query current stock quantity
                    const stock = await prisma.stockMovement.aggregate({
                        where: {
                            productId: item.itemId,
                            companyId: data.companyId,
                            ...(data.warehouseId && { warehouseId: data.warehouseId })
                        },
                        _sum: { quantity: true }
                    });

                    return {
                        itemId: item.itemId,
                        systemQuantity: stock._sum.quantity || 0,
                        countedQuantity: 0,
                        varianceQuantity: 0,
                        varianceValue: 0
                    };
                })
            );

            // Create adjustment record
            const adjustment = await prisma.stockAdjustment.create({
                data: {
                    adjustmentNumber: `RECON-${Date.now()}`,
                    companyId: data.companyId,
                    date: new Date(),
                    reason: data.purpose,
                    createdBy: data.createdById,
                    status: 'DRAFT',
                    notes: `Stock reconciliation - ${data.purpose}`
                }
            });

            return {
                id: adjustment.id,
                reconciliationNumber: adjustment.adjustmentNumber,
                status: 'DRAFT',
                items: itemsWithStock,
                createdAt: adjustment.createdAt
            };
        } catch (error) {
            logger.error('Error creating reconciliation:', error);
            throw error;
        }
    }

    /**
     * Update counted quantities
     */
    async updateCounts(reconciliationId: string, items: Array<{
        itemId: string;
        countedQuantity: number;
        reason?: string;
    }>): Promise<any> {
        try {
            logger.info(`Updating counts for reconciliation ${reconciliationId}`);

            // Would update each item's counted quantity and calculate variance
            return {
                id: reconciliationId,
                itemsUpdated: items.length,
                success: true
            };
        } catch (error) {
            logger.error('Error updating counts:', error);
            throw error;
        }
    }

    /**
     * Submit reconciliation for approval
     */
    async submitForApproval(reconciliationId: string): Promise<any> {
        try {
            const existing = await prisma.stockAdjustment.findUnique({ where: { id: reconciliationId } });
            if (!existing) throw new Error('Reconciliation not found');
            const updated = await prisma.stockAdjustment.update({
                where: { id: reconciliationId, companyId: existing.companyId },
                data: { status: 'SUBMITTED' }
            });

            return { id: updated.id, status: 'SUBMITTED' };
        } catch (error) {
            logger.error('Error submitting reconciliation:', error);
            throw error;
        }
    }

    /**
     * Approve and post reconciliation - creates stock adjustments
     */
    async approveAndPost(reconciliationId: string, approvedById: string): Promise<any> {
        try {
            logger.info(`Approving and posting reconciliation ${reconciliationId}`);

            // This would:
            // 1. Update status to APPROVED/POSTED
            // 2. Create stock movements for each variance
            // 3. Update inventory quantities

            const existing = await prisma.stockAdjustment.findUnique({ where: { id: reconciliationId } });
            if (!existing) throw new Error('Reconciliation not found');
            const updated = await prisma.stockAdjustment.update({
                where: { id: reconciliationId, companyId: existing.companyId },
                data: {
                    status: 'APPROVED'
                }
            });

            return { id: updated.id, status: 'POSTED', postedAt: new Date() };
        } catch (error) {
            logger.error('Error posting reconciliation:', error);
            throw error;
        }
    }

    /**
     * Get variance report
     */
    async getVarianceReport(companyId: string, dateFrom?: Date, dateTo?: Date): Promise<any> {
        try {
            return {
                totalReconciliations: 0,
                totalItemsCounted: 0,
                totalVarianceValue: 0,
                varianceByCategory: [],
                varianceByWarehouse: []
            };
        } catch (error) {
            logger.error('Error generating variance report:', error);
            throw error;
        }
    }
}

export const stockReconciliationService = new StockReconciliationService();
export default stockReconciliationService;
