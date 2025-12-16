/**
 * Offline Service
 * 
 * Wrapper service that intercepts API calls and routes to local IndexedDB when offline.
 * Implements optimistic updates for immediate UI responsiveness.
 */

import { db, type SyncQueueItem, type SyncStatus, getTimestamp, generateOfflineId } from '../lib/db';
import syncService from './syncService';

// ============ TYPES ============

type EntityType = SyncQueueItem['entity'];

export interface OfflineOperationResult<T> {
    success: boolean;
    data?: T;
    isOffline: boolean;
    error?: string;
}

// ============ OFFLINE SERVICE CLASS ============

class OfflineService {
    private isOnline: boolean = navigator.onLine;

    constructor() {
        window.addEventListener('online', () => {
            this.isOnline = true;
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // ============ GENERIC CRUD OPERATIONS ============

    /**
     * Get all records for an entity (offline-first)
     */
    async getAll<T>(entity: EntityType, companyId: string): Promise<T[]> {
        const table = db[entity];
        const localData = await table.where('companyId').equals(companyId).toArray();
        return localData as unknown as T[];
    }

    /**
     * Get a single record by ID (offline-first)
     */
    async getById<T>(entity: EntityType, id: string): Promise<T | undefined> {
        const table = db[entity];
        const record = await table.get(id);
        return record as unknown as T | undefined;
    }

    /**
     * Create a new record (offline-first with optimistic update)
     */
    async create<T extends Record<string, unknown>>(
        entity: EntityType,
        data: Omit<T, 'id' | 'syncStatus' | 'syncVersion' | 'createdAt' | 'updatedAt'>,
        companyId: string
    ): Promise<OfflineOperationResult<T>> {
        const id = generateOfflineId();
        const timestamp = getTimestamp();

        const record = {
            ...data,
            id,
            companyId,
            syncStatus: 'pending' as SyncStatus,
            syncVersion: 1,
            createdAt: timestamp,
            updatedAt: timestamp
        };

        try {
            // Save to local DB
            const table = db[entity];
            await table.add(record as never);

            // Queue for sync
            await syncService.queueChange(entity, 'create', id, record);

            return {
                success: true,
                data: record as unknown as T,
                isOffline: !this.isOnline
            };
        } catch (error) {
            return {
                success: false,
                isOffline: !this.isOnline,
                error: (error as Error).message
            };
        }
    }

    /**
     * Update an existing record (offline-first with optimistic update)
     */
    async update<T extends Record<string, unknown>>(
        entity: EntityType,
        id: string,
        data: Partial<T>
    ): Promise<OfflineOperationResult<T>> {
        const timestamp = getTimestamp();
        const table = db[entity];

        try {
            // Get existing record
            const existing = await table.get(id);
            if (!existing) {
                return {
                    success: false,
                    isOffline: !this.isOnline,
                    error: 'Record not found'
                };
            }

            // Prepare updated record
            const updatedRecord = {
                ...existing,
                ...data,
                syncStatus: 'pending' as SyncStatus,
                syncVersion: ((existing as { syncVersion?: number }).syncVersion || 0) + 1,
                updatedAt: timestamp
            };

            // Update local DB
            await table.put(updatedRecord as never);

            // Queue for sync
            await syncService.queueChange(entity, 'update', id, updatedRecord as Record<string, unknown>);

            return {
                success: true,
                data: updatedRecord as unknown as T,
                isOffline: !this.isOnline
            };
        } catch (error) {
            return {
                success: false,
                isOffline: !this.isOnline,
                error: (error as Error).message
            };
        }
    }

    /**
     * Delete a record (offline-first with optimistic update)
     */
    async delete(entity: EntityType, id: string): Promise<OfflineOperationResult<void>> {
        const table = db[entity];

        try {
            // Get existing record for sync
            const existing = await table.get(id);
            if (!existing) {
                return {
                    success: false,
                    isOffline: !this.isOnline,
                    error: 'Record not found'
                };
            }

            // Delete from local DB
            await table.delete(id);

            // Queue for sync (unless it was only created offline and never synced)
            if (!id.startsWith('offline_')) {
                await syncService.queueChange(entity, 'delete', id, { id });
            }

            return {
                success: true,
                isOffline: !this.isOnline
            };
        } catch (error) {
            return {
                success: false,
                isOffline: !this.isOnline,
                error: (error as Error).message
            };
        }
    }

    // ============ ENTITY-SPECIFIC METHODS ============

    // Parties
    async getParties(companyId: string) {
        return this.getAll('parties', companyId);
    }

    async getParty(id: string) {
        return this.getById('parties', id);
    }

    async createParty(data: Record<string, unknown>, companyId: string) {
        return this.create('parties', data, companyId);
    }

    async updateParty(id: string, data: Record<string, unknown>) {
        return this.update('parties', id, data);
    }

    async deleteParty(id: string) {
        return this.delete('parties', id);
    }

    // Products
    async getProducts(companyId: string) {
        return this.getAll('products', companyId);
    }

    async getProduct(id: string) {
        return this.getById('products', id);
    }

    async createProduct(data: Record<string, unknown>, companyId: string) {
        return this.create('products', data, companyId);
    }

    async updateProduct(id: string, data: Record<string, unknown>) {
        return this.update('products', id, data);
    }

    async deleteProduct(id: string) {
        return this.delete('products', id);
    }

    // Invoices
    async getInvoices(companyId: string) {
        return this.getAll('invoices', companyId);
    }

    async getInvoice(id: string) {
        return this.getById('invoices', id);
    }

    async createInvoice(data: Record<string, unknown>, companyId: string) {
        return this.create('invoices', data, companyId);
    }

    async updateInvoice(id: string, data: Record<string, unknown>) {
        return this.update('invoices', id, data);
    }

    async deleteInvoice(id: string) {
        return this.delete('invoices', id);
    }

    // Estimates
    async getEstimates(companyId: string) {
        return this.getAll('estimates', companyId);
    }

    async getEstimate(id: string) {
        return this.getById('estimates', id);
    }

    async createEstimate(data: Record<string, unknown>, companyId: string) {
        return this.create('estimates', data, companyId);
    }

    async updateEstimate(id: string, data: Record<string, unknown>) {
        return this.update('estimates', id, data);
    }

    async deleteEstimate(id: string) {
        return this.delete('estimates', id);
    }

    // Sales Orders
    async getSalesOrders(companyId: string) {
        return this.getAll('salesOrders', companyId);
    }

    async getSalesOrder(id: string) {
        return this.getById('salesOrders', id);
    }

    async createSalesOrder(data: Record<string, unknown>, companyId: string) {
        return this.create('salesOrders', data, companyId);
    }

    async updateSalesOrder(id: string, data: Record<string, unknown>) {
        return this.update('salesOrders', id, data);
    }

    async deleteSalesOrder(id: string) {
        return this.delete('salesOrders', id);
    }

    // Purchase Orders
    async getPurchaseOrders(companyId: string) {
        return this.getAll('purchaseOrders', companyId);
    }

    async getPurchaseOrder(id: string) {
        return this.getById('purchaseOrders', id);
    }

    async createPurchaseOrder(data: Record<string, unknown>, companyId: string) {
        return this.create('purchaseOrders', data, companyId);
    }

    async updatePurchaseOrder(id: string, data: Record<string, unknown>) {
        return this.update('purchaseOrders', id, data);
    }

    async deletePurchaseOrder(id: string) {
        return this.delete('purchaseOrders', id);
    }

    /**
     * Bulk upsert records (used during initial sync or full refresh)
     */
    async bulkUpsert<T extends { id: string }>(
        entity: EntityType,
        records: T[]
    ): Promise<void> {
        if (!records || records.length === 0) return;

        const timestamp = getTimestamp();

        const recordsWithSync = records.map(record => ({
            ...record,
            syncStatus: 'synced' as SyncStatus,
            updatedAt: timestamp
        }));

        // Use type assertion for dynamic table access
        const table = db[entity] as unknown as { bulkPut: (items: unknown[]) => Promise<void> };
        await table.bulkPut(recordsWithSync);
    }

    /**
     * Clear all data for an entity
     */
    async clearEntity(entity: EntityType): Promise<void> {
        const table = db[entity];
        await table.clear();
    }
}

// ============ SINGLETON EXPORT ============

export const offlineService = new OfflineService();
export default offlineService;
