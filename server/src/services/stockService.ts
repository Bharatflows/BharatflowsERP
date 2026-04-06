import prisma from '../config/prisma';
import eventBus, { EventTypes } from './eventBus';
import * as accountingService from './accountingService';

interface StockAdjustmentInput {
    productId: string;
    quantity: number;
    type: string; // 'ADJUSTMENT', 'DAMAGE', 'WRITE_OFF'
    reason?: string;
    notes?: string;
    warehouseId?: string;
    companyId: string;
    userId: string;
}

interface StockTransferInput {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    notes?: string;
    companyId: string;
    userId: string;
}

class StockService {
    /**
     * Adjust Stock (Increase or Decrease)
     * Triggers GL Posting for Perpetual Inventory
     */
    async adjustStock(input: StockAdjustmentInput) {
        const { productId, quantity, type, reason, notes, warehouseId, companyId, userId } = input;

        const product = await prisma.product.findFirst({
            where: { id: productId, companyId }
        });

        if (!product) throw new Error('Product not found');

        const previousStock = product.currentStock;
        const newStock = previousStock + quantity;

        if (newStock < 0) throw new Error('Insufficient stock');

        // 1. Update Product Stock
        await prisma.product.update({
            where: { id: productId, companyId },
            data: { currentStock: newStock }
        });

        // 2. Create Stock Movement
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

        // 3. Accounting Entry (Perpetual Inventory)
        // If product tracks inventory and has a valuation rate
        if (product.trackInventory && Number(product.purchasePrice) > 0) {
            await this.postStockAccounting(stockMovement, product, companyId, userId);
        }

        // 4. Emit Event
        await this.emitStockEvent(stockMovement, product, input);

        return stockMovement;
    }

    /**
     * Post GL Entry for Stock Movement
     */
    async postStockAccounting(movement: any, product: any, companyId: string, userId: string) {
        // Value = Quantity * Cost Price (Weighted Average in future, currently Purchase Price)
        const value = Math.abs(movement.quantity) * Number(product.purchasePrice);

        if (value === 0) return;

        // Ledgers (Hardcoded defaults for now, should come from Settings/Product Category)
        // TODO: Move to DefaultLedgers configuration
        const stockAssetsLedger = await this.getLedger(companyId, 'Stock Assets');
        const stockAdjustmentLedger = await this.getLedger(companyId, 'Stock Adjustment');

        if (!stockAssetsLedger || !stockAdjustmentLedger) {
            console.warn('Stock Ledgers not found. Skipping GL entry.');
            return;
        }

        const isIncrease = movement.quantity > 0;

        // DEBIT is Asset Increase / Expense Increase
        // CREDIT is Asset Decrease / Income Increase

        const postings = [];

        if (isIncrease) {
            // Stock IN: Dr Stock Assets, Cr Stock Adjustment (Income/Gain)
            postings.push({
                ledgerId: stockAssetsLedger.id,
                amount: value,
                type: 'DEBIT' as const,
                narration: `Stock Increase: ${product.name}`
            });
            postings.push({
                ledgerId: stockAdjustmentLedger.id,
                amount: value,
                type: 'CREDIT' as const,
                narration: `Stock Adjustment Gain: ${movement.reason || ''}`
            });
        } else {
            // Stock OUT: Dr Stock Adjustment (Expense/Loss), Cr Stock Assets
            postings.push({
                ledgerId: stockAdjustmentLedger.id,
                amount: value,
                type: 'DEBIT' as const,
                narration: `Stock Adjustment Loss: ${movement.reason || ''}`
            });
            postings.push({
                ledgerId: stockAssetsLedger.id,
                amount: value,
                type: 'CREDIT' as const,
                narration: `Stock Decrease: ${product.name}`
            });
        }

        await accountingService.createVoucher({
            companyId,
            date: new Date(),
            type: 'JOURNAL', // Or STOCK_ENTRY
            referenceType: 'STOCK_MOVEMENT',
            referenceId: movement.id,
            narration: `Stock Adjustment for ${product.name} (${movement.quantity})`,
            postings,
            createdById: userId,
            status: 'POSTED'
        });
    }

    async transferStock(input: StockTransferInput) {
        const { productId, fromWarehouseId, toWarehouseId, quantity, notes, companyId, userId } = input;

        if (quantity <= 0) throw new Error('Quantity must be greater than 0');

        const product = await prisma.product.findFirst({
            where: { id: productId, companyId }
        });

        if (!product) throw new Error('Product not found');

        const previousStock = product.currentStock;

        // Transactional update
        return prisma.$transaction(async (tx) => {
            const transferOut = await tx.stockMovement.create({
                data: {
                    productId,
                    type: 'TRANSFER_OUT',
                    quantity: -quantity,
                    previousStock,
                    newStock: previousStock, // Stock transfer doesn't change global stock usually, but warehouse stock. Logic here assumes global stock tracking on Product. Ideally need WarehouseProduct model.
                    warehouseId: fromWarehouseId,
                    notes,
                    createdBy: userId,
                    companyId
                }
            });

            const transferIn = await tx.stockMovement.create({
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

            return { transferOut, transferIn };
        });

        // Note: Transfers usually don't impact GL unless warehouses differ in valuation or region (Branch Accounting). 
        // Skipping GL for simple transfer.
    }

    private async getLedger(companyId: string, name: string) {
        return prisma.ledger.findFirst({
            where: { companyId, name }
        });
    }

    private async emitStockEvent(movement: any, product: any, input: any) {
        let adjustmentType: 'INCREASE' | 'DECREASE' | 'WRITE_OFF' | 'DAMAGE' = 'DECREASE';
        if (movement.quantity > 0) {
            adjustmentType = 'INCREASE';
        } else if (input.type === 'DAMAGE') {
            adjustmentType = 'DAMAGE';
        } else if (input.type === 'WRITE_OFF' || input.type === 'LOSS') {
            adjustmentType = 'WRITE_OFF';
        }

        await eventBus.emit({
            companyId: movement.companyId,
            eventType: EventTypes.STOCK_ADJUSTMENT_CREATED,
            aggregateType: 'StockMovement',
            aggregateId: movement.id,
            payload: {
                adjustmentNumber: `ADJ-${movement.id.slice(-6).toUpperCase()}`,
                productId: movement.productId,
                productName: product.name,
                date: new Date(),
                type: adjustmentType,
                quantity: movement.quantity,
                totalValue: Math.abs(movement.quantity) * Number(product.purchasePrice || 0),
                reason: movement.reason || input.notes || 'Stock adjustment'
            },
            metadata: { userId: movement.createdBy, source: 'api' }
        });
    }

}

export const stockService = new StockService();
