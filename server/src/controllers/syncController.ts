/**
 * Sync Controller
 * 
 * Handles multi-device synchronization operations.
 * Implements:
 * - Bulk sync operations for offline changes
 * - Conflict resolution (Last Write Wins)
 * - Delta sync for efficient data transfer
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { eventBus, EventTypes } from '../services/eventBus';
import logger from '../config/logger';

const prisma = new PrismaClient();

// ============ TYPES ============

interface SyncChange {
    entity: 'parties' | 'products' | 'invoices' | 'estimates' | 'salesOrders' | 'purchaseOrders';
    action: 'create' | 'update' | 'delete';
    id: string;
    data: Record<string, unknown>;
    clientTimestamp: string;
    syncVersion: number;
}

interface SyncRequest {
    changes: SyncChange[];
    lastSyncedAt: string | null;
    deviceId: string;
}

interface AppliedChange {
    id: string;
    serverId?: string;
    entity: string;
}

interface ConflictChange {
    id: string;
    entity: string;
    serverData: Record<string, unknown>;
    resolution: 'server_wins' | 'client_wins';
}

interface ServerChange {
    entity: string;
    action: string;
    data: Record<string, unknown>;
}

// ============ ENTITY MAPPING ============

const entityModelMap: Record<string, string> = {
    parties: 'party',
    products: 'product',
    invoices: 'invoice',
    estimates: 'estimate',
    salesOrders: 'salesOrder',
    purchaseOrders: 'purchaseOrder'
};

// ============ SYNC ENDPOINT ============

/**
 * POST /api/v1/sync
 * 
 * Main sync endpoint that:
 * 1. Receives client changes
 * 2. Applies them to the database (with conflict resolution)
 * 3. Returns server changes since last sync
 */
export const sync = async (req: AuthRequest, res: Response) => {
    try {
        const { changes, lastSyncedAt, deviceId } = req.body as SyncRequest;
        const companyId = req.user?.companyId;
        const userId = req.user?.id;

        if (!companyId || !userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const applied: AppliedChange[] = [];
        const conflicts: ConflictChange[] = [];
        const serverChanges: ServerChange[] = [];
        const syncTimestamp = new Date().toISOString();

        // Process each client change
        for (const change of changes) {
            try {
                const result = await processChange(change, companyId, userId, deviceId);

                if (result.type === 'applied') {
                    applied.push(result.data as AppliedChange);
                } else if (result.type === 'conflict') {
                    conflicts.push(result.data as ConflictChange);
                }
            } catch (error) {
                logger.error(`Error processing change for ${change.entity}:${change.id}:`, error);
                // Continue with other changes
            }
        }

        // Get server changes since last sync (from other devices)
        if (lastSyncedAt) {
            const serverUpdates = await getServerChanges(companyId, lastSyncedAt, deviceId);
            serverChanges.push(...serverUpdates);
        }

        return res.json({
            applied,
            conflicts,
            serverChanges,
            syncTimestamp
        });
    } catch (error) {
        logger.error('Sync error:', error);
        return res.status(500).json({ message: 'Sync failed', error: (error as Error).message });
    }
};

// ============ PROCESS INDIVIDUAL CHANGES ============

async function processChange(
    change: SyncChange,
    companyId: string,
    userId: string,
    deviceId: string
): Promise<{ type: 'applied' | 'conflict'; data: AppliedChange | ConflictChange }> {
    const model = entityModelMap[change.entity];

    switch (change.action) {
        case 'create':
            return await processCreate(change, companyId, userId, deviceId);
        case 'update':
            return await processUpdate(change, companyId, userId, deviceId);
        case 'delete':
            return await processDelete(change, companyId);
        default:
            throw new Error(`Unknown action: ${change.action}`);
    }
}

async function processCreate(
    change: SyncChange,
    companyId: string,
    userId: string,
    deviceId: string
): Promise<{ type: 'applied'; data: AppliedChange }> {
    const { entity, id, data } = change;

    // Remove offline ID prefix and sync metadata
    const cleanData = { ...data };
    delete cleanData.id;
    delete cleanData.syncStatus;
    delete cleanData.syncVersion;

    // Add company reference
    cleanData.companyId = companyId;
    cleanData.lastModifiedBy = `${userId}:${deviceId}`;

    let serverId: string;

    switch (entity) {
        case 'parties':
            const party = await prisma.party.create({
                data: cleanData as Parameters<typeof prisma.party.create>[0]['data']
            });
            serverId = party.id;
            break;

        case 'products':
            const product = await prisma.product.create({
                data: cleanData as Parameters<typeof prisma.product.create>[0]['data']
            });
            serverId = product.id;
            break;

        case 'invoices':
            const invoice = await prisma.invoice.create({
                data: cleanData as Parameters<typeof prisma.invoice.create>[0]['data']
            });
            serverId = invoice.id;
            break;

        case 'estimates':
            const estimate = await prisma.estimate.create({
                data: cleanData as Parameters<typeof prisma.estimate.create>[0]['data']
            });
            serverId = estimate.id;
            break;

        case 'salesOrders':
            const salesOrder = await prisma.salesOrder.create({
                data: cleanData as Parameters<typeof prisma.salesOrder.create>[0]['data']
            });
            serverId = salesOrder.id;
            break;

        case 'purchaseOrders':
            const purchaseOrder = await prisma.purchaseOrder.create({
                data: cleanData as Parameters<typeof prisma.purchaseOrder.create>[0]['data']
            });
            serverId = purchaseOrder.id;
            break;

        default:
            throw new Error(`Unknown entity: ${entity}`);
    }

    // Log the sync action
    await logSyncAction(companyId, userId, deviceId, entity, serverId, 'create', cleanData);

    // Emit domain event
    let eventType = '';
    switch (entity) {
        case 'parties': eventType = EventTypes.PARTY_CREATED; break;
        case 'products': eventType = EventTypes.PRODUCT_CREATED; break;
        case 'invoices': eventType = EventTypes.INVOICE_CREATED; break;
        case 'estimates': eventType = EventTypes.ESTIMATE_CREATED; break;
        case 'salesOrders': eventType = EventTypes.SALES_ORDER_CREATED; break;
        case 'purchaseOrders': eventType = EventTypes.PURCHASE_ORDER_CREATED; break;
    }

    if (eventType) {
        await eventBus.emit({
            companyId,
            eventType,
            aggregateType: entityModelMap[entity] || entity,
            aggregateId: serverId,
            payload: { ...cleanData, id: serverId },
            metadata: { userId, deviceId, source: 'sync' }
        });
    }

    return {
        type: 'applied',
        data: { id, serverId, entity }
    };
}

async function processUpdate(
    change: SyncChange,
    companyId: string,
    userId: string,
    deviceId: string
): Promise<{ type: 'applied' | 'conflict'; data: AppliedChange | ConflictChange }> {
    const { entity, id, data, syncVersion, clientTimestamp } = change;

    // Get current server record
    const serverRecord = await getServerRecord(entity, id, companyId);

    if (!serverRecord) {
        // Record doesn't exist, treat as create
        return processCreate(change, companyId, userId, deviceId);
    }

    // SAFETY CHECK (P1): Prevent offline updates to finalized documents
    if (!validateSyncUpdate(entity, serverRecord)) {
        logger.warn(`[SYNC] Blocked update to finalized document ${entity}:${id}`);
        // Return conflict with server wins (effectively ignoring the client update)
        return {
            type: 'conflict',
            data: {
                id,
                entity,
                serverData: serverRecord as Record<string, unknown>,
                resolution: 'server_wins'
            }
        };
    }

    // Check for conflicts (Last Write Wins based on timestamp)
    const serverUpdatedAt = new Date((serverRecord as { updatedAt: Date }).updatedAt);
    const clientUpdatedAt = new Date(clientTimestamp);

    if (serverUpdatedAt > clientUpdatedAt) {
        // Server has newer data - conflict, server wins
        const conflict = await prisma.syncConflict.create({
            data: {
                companyId,
                userId,
                entityType: entity,
                entityId: id,
                clientVersion: data as any, // Cast to JSON
                serverVersion: serverRecord as any, // Cast to JSON
                status: 'RESOLVED_SERVER', // Auto-resolve to server for LWW
                resolvedAt: new Date(),
                resolvedBy: 'SYSTEM_LWW'
            }
        });

        return {
            type: 'conflict',
            data: {
                id,
                entity,
                serverData: serverRecord as Record<string, unknown>,
                resolution: 'server_wins'
            }
        };
    }

    // Client has newer data - apply update
    const cleanData = { ...data };
    delete cleanData.id;
    delete cleanData.syncStatus;
    delete cleanData.syncVersion;
    delete cleanData.companyId;

    cleanData.lastModifiedBy = `${userId}:${deviceId}`;
    cleanData.updatedAt = new Date();

    await updateServerRecord(entity, id, cleanData, companyId);

    // Emit domain event for side effects
    let eventType = '';
    switch (entity) {
        case 'parties': eventType = EventTypes.PARTY_UPDATED; break;
        case 'products': eventType = EventTypes.PRODUCT_UPDATED; break;
        case 'invoices': eventType = EventTypes.INVOICE_UPDATED; break;
        // Add others if available
    }

    if (eventType) {
        await eventBus.emit({
            companyId,
            eventType,
            aggregateType: entityModelMap[entity] || entity,
            aggregateId: id,
            payload: cleanData,
            metadata: { userId, deviceId, source: 'sync' }
        });
    }

    // Log the sync action
    await logSyncAction(companyId, userId, deviceId, entity, id, 'update', cleanData);

    return {
        type: 'applied',
        data: { id, entity }
    };
}

async function processDelete(
    change: SyncChange,
    companyId: string
): Promise<{ type: 'applied'; data: AppliedChange }> {
    const { entity, id } = change;

    await deleteServerRecord(entity, id, companyId);

    return {
        type: 'applied',
        data: { id, entity }
    };
}

// ============ DATABASE HELPERS ============

async function getServerRecord(entity: string, id: string, companyId: string): Promise<unknown> {
    switch (entity) {
        case 'parties':
            return prisma.party.findFirst({ where: { id, companyId } });
        case 'products':
            return prisma.product.findFirst({ where: { id, companyId } });
        case 'invoices':
            return prisma.invoice.findFirst({ where: { id, companyId } });
        case 'estimates':
            return prisma.estimate.findFirst({ where: { id, companyId } });
        case 'salesOrders':
            return prisma.salesOrder.findFirst({ where: { id, companyId } });
        case 'purchaseOrders':
            return prisma.purchaseOrder.findFirst({ where: { id, companyId } });
        default:
            return null;
    }
}

async function updateServerRecord(entity: string, id: string, data: Record<string, unknown>, companyId: string): Promise<void> {
    switch (entity) {
        case 'parties':
            await prisma.party.update({ where: { id, companyId: companyId }, data: data as Parameters<typeof prisma.party.update>[0]['data'] });
            break;
        case 'products':
            await prisma.product.update({ where: { id, companyId: companyId }, data: data as Parameters<typeof prisma.product.update>[0]['data'] });
            break;
        case 'invoices':
            await prisma.invoice.update({ where: { id, companyId: companyId }, data: data as Parameters<typeof prisma.invoice.update>[0]['data'] });
            break;
        case 'estimates':
            await prisma.estimate.update({ where: { id, companyId: companyId }, data: data as Parameters<typeof prisma.estimate.update>[0]['data'] });
            break;
        case 'salesOrders':
            await prisma.salesOrder.update({ where: { id, companyId: companyId }, data: data as Parameters<typeof prisma.salesOrder.update>[0]['data'] });
            break;
        case 'purchaseOrders':
            await prisma.purchaseOrder.update({ where: { id, companyId: companyId }, data: data as Parameters<typeof prisma.purchaseOrder.update>[0]['data'] });
            break;
    }
}

async function deleteServerRecord(entity: string, id: string, companyId: string): Promise<void> {
    switch (entity) {
        case 'parties':
            await prisma.party.deleteMany({ where: { id, companyId } });
            break;
        case 'products':
            await prisma.product.deleteMany({ where: { id, companyId } });
            break;
        case 'invoices':
            await prisma.invoice.deleteMany({ where: { id, companyId } });
            break;
        case 'estimates':
            await prisma.estimate.deleteMany({ where: { id, companyId } });
            break;
        case 'salesOrders':
            await prisma.salesOrder.deleteMany({ where: { id, companyId } });
            break;
        case 'purchaseOrders':
            await prisma.purchaseOrder.deleteMany({ where: { id, companyId } });
            break;
    }
}

// ============ GET SERVER CHANGES ============

async function getServerChanges(
    companyId: string,
    lastSyncedAt: string,
    excludeDeviceId: string
): Promise<ServerChange[]> {
    const since = new Date(lastSyncedAt);
    const changes: ServerChange[] = [];

    // Get updated parties
    const updatedParties = await prisma.party.findMany({
        where: {
            companyId,
            updatedAt: { gt: since }
        }
    });

    for (const party of updatedParties) {
        changes.push({
            entity: 'parties',
            action: 'update',
            data: party as unknown as Record<string, unknown>
        });
    }

    // Get updated products
    const updatedProducts = await prisma.product.findMany({
        where: {
            companyId,
            updatedAt: { gt: since }
        }
    });

    for (const product of updatedProducts) {
        changes.push({
            entity: 'products',
            action: 'update',
            data: product as unknown as Record<string, unknown>
        });
    }

    // Get updated invoices
    const updatedInvoices = await prisma.invoice.findMany({
        where: {
            companyId,
            updatedAt: { gt: since }
        }
    });

    for (const invoice of updatedInvoices) {
        changes.push({
            entity: 'invoices',
            action: 'update',
            data: invoice as unknown as Record<string, unknown>
        });
    }

    // Get updated estimates
    const updatedEstimates = await prisma.estimate.findMany({
        where: {
            companyId,
            updatedAt: { gt: since }
        }
    });

    for (const estimate of updatedEstimates) {
        changes.push({
            entity: 'estimates',
            action: 'update',
            data: estimate as unknown as Record<string, unknown>
        });
    }

    // Get updated sales orders
    const updatedSalesOrders = await prisma.salesOrder.findMany({
        where: {
            companyId,
            updatedAt: { gt: since }
        }
    });

    for (const order of updatedSalesOrders) {
        changes.push({
            entity: 'salesOrders',
            action: 'update',
            data: order as unknown as Record<string, unknown>
        });
    }

    // Get updated purchase orders
    const updatedPurchaseOrders = await prisma.purchaseOrder.findMany({
        where: {
            companyId,
            updatedAt: { gt: since }
        }
    });

    for (const order of updatedPurchaseOrders) {
        changes.push({
            entity: 'purchaseOrders',
            action: 'update',
            data: order as unknown as Record<string, unknown>
        });
    }

    return changes;
}

// ============ SYNC LOGGING ============

async function logSyncAction(
    companyId: string,
    userId: string,
    deviceId: string,
    entity: string,
    entityId: string,
    action: string,
    changes: Record<string, unknown>
): Promise<void> {
    // This would log to a SyncLog table if you add it to the schema
    logger.info(`[SYNC] ${action} ${entity}:${entityId} by ${userId}:${deviceId}`);
}

// ============ INITIAL SYNC ============

/**
 * GET /api/v1/sync/initial
 * 
 * Get all data for initial sync when app is first installed
 * or when a full refresh is requested.
 */
export const initialSync = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        if (!companyId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const [parties, products, invoices, estimates, salesOrders, purchaseOrders] = await Promise.all([
            prisma.party.findMany({ where: { companyId } }),
            prisma.product.findMany({ where: { companyId } }),
            prisma.invoice.findMany({
                where: { companyId },
                include: { items: true }
            }),
            prisma.estimate.findMany({
                where: { companyId },
                include: { items: true }
            }),
            prisma.salesOrder.findMany({
                where: { companyId },
                include: { items: true }
            }),
            prisma.purchaseOrder.findMany({
                where: { companyId },
                include: { items: true }
            })
        ]);

        return res.json({
            parties,
            products,
            invoices,
            estimates,
            salesOrders,
            purchaseOrders,
            syncTimestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Initial sync error:', error);
        return res.status(500).json({ message: 'Initial sync failed', error: (error as Error).message });
    }
};

/**
 * GET /api/v1/sync/status
 * 
 * Get sync status and pending changes count
 */
export const getSyncStatus = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        if (!companyId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        return res.json({
            status: 'ok',
            serverTime: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to get sync status' });
    }
};

/**
 * Validate if a sync update is allowed based on entity status.
 * Returns false if the update should be blocked (e.g., trying to edit a POSTED invoice).
 */
function validateSyncUpdate(entity: string, serverRecord: any): boolean {
    if (!serverRecord) return true;

    // Invoices: Block updates if POSTED, PAID, PARTIALLY_PAID, CANCELLED
    if (entity === 'invoices') {
        const restrictedStatuses = ['POSTED', 'PAID', 'PARTIALLY_PAID', 'CANCELLED'];
        if (restrictedStatuses.includes(serverRecord.status)) {
            return false;
        }
    }

    // Sales Orders: Block if CONFIRMED, SHIPPED, COMPLETED, CANCELLED
    if (entity === 'salesOrders') {
        const restrictedStatuses = ['CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
        if (restrictedStatuses.includes(serverRecord.status)) {
            return false;
        }
    }

    // Purchase Orders: Block if CONFIRMED, RECEIVED, COMPLETED, CANCELLED
    if (entity === 'purchaseOrders') {
        const restrictedStatuses = ['CONFIRMED', 'RECEIVED', 'COMPLETED', 'CANCELLED'];
        if (restrictedStatuses.includes(serverRecord.status)) {
            return false;
        }
    }

    return true;
}
