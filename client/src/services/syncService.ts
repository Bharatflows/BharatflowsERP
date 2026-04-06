/**
 * Sync Service
 * 
 * Handles background synchronization between local IndexedDB and remote server.
 * Implements:
 * - Network status monitoring
 * - Queue management for offline changes
 * - Conflict resolution (Last Write Wins)
 * - Automatic sync on reconnection
 */

import { db, type SyncQueueItem, type SyncStatus, getTimestamp } from '../lib/db';
import apiService from './api';

// ============ TYPES ============

export interface SyncChange {
    entity: SyncQueueItem['entity'];
    action: 'create' | 'update' | 'delete';
    id: string;
    data: Record<string, unknown>;
    clientTimestamp: string;
    syncVersion: number;
}

export interface SyncRequest {
    changes: SyncChange[];
    lastSyncedAt: string | null;
    deviceId: string;
}

export interface SyncResponse {
    applied: Array<{ id: string; serverId?: string; entity: string }>;
    conflicts: Array<{ id: string; entity: string; serverData: Record<string, unknown>; resolution: 'server_wins' | 'client_wins' }>;
    serverChanges: Array<{ entity: string; action: string; data: Record<string, unknown> }>;
    syncTimestamp: string;
}

export type SyncEventType =
    | 'sync:started'
    | 'sync:completed'
    | 'sync:failed'
    | 'sync:conflict'
    | 'sync:conflict_pending_manual' // New: needs manual resolution
    | 'network:online'
    | 'network:offline'
    | 'queue:changed';

export interface SyncEvent {
    type: SyncEventType;
    data?: Record<string, unknown>;
}

type SyncEventListener = (event: SyncEvent) => void;

/**
 * Conflict Resolution Strategy
 * 
 * Phase 3: Tiered conflict resolution rules:
 * 1. SERVER_WINS - For financial data (invoices, payments) - data integrity > convenience
 * 2. LAST_WRITE_WINS - For drafts and non-critical data - convenience > data integrity  
 * 3. MANUAL_MERGE - For parties/products - requires user review
 */
export type ConflictStrategy = 'SERVER_WINS' | 'LAST_WRITE_WINS' | 'MANUAL_MERGE';

// Determine resolution strategy based on entity type
function getConflictStrategy(entity: SyncQueueItem['entity'], data: Record<string, unknown>): ConflictStrategy {
    // Financial entities - server always wins to preserve data integrity
    if (entity === 'invoices' || entity === 'posOrders') {
        return 'SERVER_WINS';
    }

    // Draft documents - last write wins
    if (entity === 'estimates' || entity === 'salesOrders' || entity === 'purchaseOrders') {
        const status = data.status as string | undefined;
        if (status === 'DRAFT' || status === 'draft') {
            return 'LAST_WRITE_WINS';
        }
        // Non-draft (finalized) orders - server wins
        return 'SERVER_WINS';
    }

    // Parties and Products - require manual merge for edits
    if (entity === 'parties' || entity === 'products') {
        return 'MANUAL_MERGE';
    }

    // Default fallback
    return 'LAST_WRITE_WINS';
}

// Compare timestamps to determine winner for LAST_WRITE_WINS
function isClientNewer(clientData: Record<string, unknown>, serverData: Record<string, unknown>): boolean {
    const clientTime = new Date(clientData.updatedAt as string || '1970-01-01').getTime();
    const serverTime = new Date(serverData.updatedAt as string || '1970-01-01').getTime();
    return clientTime > serverTime;
}

// ============ SYNC SERVICE CLASS ============

class SyncService {
    private isOnline: boolean = navigator.onLine;
    private isSyncing: boolean = false;
    private syncInterval: ReturnType<typeof setInterval> | null = null;
    private deviceId: string;
    private listeners: Set<SyncEventListener> = new Set();
    private companyId: string | null = null;

    constructor() {
        this.deviceId = this.getOrCreateDeviceId();
        this.setupNetworkListeners();
        this.startPeriodicSync();
    }

    // ============ INITIALIZATION ============

    private getOrCreateDeviceId(): string {
        let deviceId = localStorage.getItem('bharatflow_device_id');
        if (!deviceId) {
            deviceId = `device_${crypto.randomUUID()}`;
            localStorage.setItem('bharatflow_device_id', deviceId);
        }
        return deviceId;
    }

    private setupNetworkListeners(): void {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.emit({ type: 'network:online' });
            // Trigger sync when coming back online
            this.sync();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.emit({ type: 'network:offline' });
        });
    }

    private startPeriodicSync(): void {
        // Sync every 30 seconds when online
        this.syncInterval = setInterval(() => {
            if (this.isOnline && !this.isSyncing) {
                this.sync();
            }
        }, 30000);
    }

    // ============ PUBLIC API ============

    /**
     * Set the current company ID for sync operations
     */
    setCompanyId(companyId: string): void {
        this.companyId = companyId;
    }

    /**
     * Get current network status
     */
    getNetworkStatus(): boolean {
        return this.isOnline;
    }

    /**
     * Get current sync status
     */
    getSyncStatus(): boolean {
        return this.isSyncing;
    }

    /**
     * Subscribe to sync events
     */
    subscribe(listener: SyncEventListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Emit an event to all listeners
     */
    private emit(event: SyncEvent): void {
        this.listeners.forEach(listener => listener(event));
    }

    /**
     * Queue a change for sync
     */
    async queueChange(
        entity: SyncQueueItem['entity'],
        action: 'create' | 'update' | 'delete',
        entityId: string,
        data: Record<string, unknown>
    ): Promise<void> {
        await db.syncQueue.add({
            entity,
            action,
            entityId,
            data,
            createdAt: getTimestamp(),
            retryCount: 0
        });

        this.emit({ type: 'queue:changed', data: { pendingCount: await db.syncQueue.count() } });

        // Try to sync immediately if online
        if (this.isOnline && !this.isSyncing) {
            this.sync();
        }
    }

    /**
     * Get pending conflicts that need manual resolution
     */
    async getPendingConflicts(): Promise<Array<{ entity: string; entityId: string; localData: unknown; syncStatus: string }>> {
        const conflicts: Array<{ entity: string; entityId: string; localData: unknown; syncStatus: string }> = [];

        const entities: SyncQueueItem['entity'][] = ['parties', 'products', 'invoices', 'estimates', 'salesOrders', 'purchaseOrders'];

        for (const entity of entities) {
            const table = db[entity];
            const items = await table.where('syncStatus').equals('conflict').toArray();
            for (const item of items) {
                conflicts.push({
                    entity,
                    entityId: (item as { id: string }).id,
                    localData: item,
                    syncStatus: 'conflict'
                });
            }
        }

        return conflicts;
    }

    /**
     * Resolve a conflict manually
     * @param entity - The entity type
     * @param entityId - The record ID
     * @param resolution - 'keep_local' to keep client data, 'use_server' to accept server data
     * @param serverData - The server data (required if resolution is 'use_server')
     */
    async resolveConflict(
        entity: SyncQueueItem['entity'],
        entityId: string,
        resolution: 'keep_local' | 'use_server',
        serverData?: Record<string, unknown>
    ): Promise<void> {
        if (resolution === 'use_server' && serverData) {
            // Accept server data
            await this.mergeServerData(entity, serverData);
            await db.syncQueue.where('entityId').equals(entityId).delete();
        } else {
            // Keep local data - mark as pending for re-sync
            await this.updateSyncStatus(entity, entityId, 'pending');
            // Trigger sync to push local version
            if (this.isOnline && !this.isSyncing) {
                this.sync();
            }
        }

        this.emit({ type: 'queue:changed', data: { pendingCount: await db.syncQueue.count() } });
    }

    /**
     * Trigger a manual sync
     */
    async sync(): Promise<boolean> {
        if (!this.isOnline || this.isSyncing || !this.companyId) {
            return false;
        }

        this.isSyncing = true;
        this.emit({ type: 'sync:started' });

        try {
            // Get all pending changes
            const pendingChanges = await db.syncQueue.toArray();

            if (pendingChanges.length === 0) {
                // No local changes, just fetch server updates
                await this.fetchServerChanges();
                this.isSyncing = false;
                this.emit({ type: 'sync:completed', data: { changesApplied: 0 } });
                return true;
            }

            // Build sync request
            const changes: SyncChange[] = await Promise.all(
                pendingChanges.map(async (item) => {
                    const localRecord = await this.getLocalRecord(item.entity, item.entityId);
                    return {
                        entity: item.entity,
                        action: item.action,
                        id: item.entityId,
                        data: item.data,
                        clientTimestamp: item.createdAt,
                        syncVersion: (localRecord as { syncVersion?: number })?.syncVersion || 1
                    };
                })
            );

            // Get last sync timestamp
            const syncMeta = await db.syncMetadata.get(this.companyId);
            const lastSyncedAt = syncMeta?.lastSyncedAt || null;

            // Send to server
            const response = await apiService.post<SyncResponse>('/v1/sync', {
                changes,
                lastSyncedAt,
                deviceId: this.deviceId
            });

            // Process applied changes
            for (const applied of response.applied) {
                // Update local record with server ID if it was an offline create
                if (applied.serverId && applied.id.startsWith('offline_')) {
                    await this.updateOfflineIdToServerId(applied.entity as SyncQueueItem['entity'], applied.id, applied.serverId);
                }

                // Mark as synced
                await this.updateSyncStatus(applied.entity as SyncQueueItem['entity'], applied.serverId || applied.id, 'synced');

                // Remove from queue
                await db.syncQueue.where('entityId').equals(applied.id).delete();
            }

            // Handle conflicts with tiered resolution strategy
            for (const conflict of response.conflicts) {
                const entity = conflict.entity as SyncQueueItem['entity'];
                const clientData = await this.getLocalRecord(entity, conflict.id);
                const strategy = getConflictStrategy(entity, clientData as Record<string, unknown> || {});

                switch (strategy) {
                    case 'SERVER_WINS':
                        // Financial data - server always wins for data integrity
                        this.emit({ type: 'sync:conflict', data: { ...conflict, strategy, resolution: 'auto' } });
                        await this.mergeServerData(entity, conflict.serverData);
                        await db.syncQueue.where('entityId').equals(conflict.id).delete();
                        break;

                    case 'LAST_WRITE_WINS':
                        // For drafts - compare timestamps
                        const clientWins = isClientNewer(clientData as Record<string, unknown> || {}, conflict.serverData);
                        this.emit({ type: 'sync:conflict', data: { ...conflict, strategy, resolution: clientWins ? 'client' : 'server' } });

                        if (clientWins) {
                            // Keep local data, mark as pending (retry will push to server)
                            await this.updateSyncStatus(entity, conflict.id, 'pending');
                        } else {
                            // Server is newer - accept server data
                            await this.mergeServerData(entity, conflict.serverData);
                            await db.syncQueue.where('entityId').equals(conflict.id).delete();
                        }
                        break;

                    case 'MANUAL_MERGE':
                        // Parties/Products - flag for manual resolution
                        await this.updateSyncStatus(entity, conflict.id, 'conflict');
                        this.emit({
                            type: 'sync:conflict_pending_manual',
                            data: {
                                ...conflict,
                                strategy,
                                clientData,
                                message: `Conflict on ${entity}: local and server versions differ. Manual review required.`
                            }
                        });
                        // Don't remove from queue - keep for manual resolution
                        break;
                }
            }

            // Apply server changes from other devices
            for (const serverChange of response.serverChanges) {
                await this.applyServerChange(serverChange);
            }

            // Update last sync timestamp
            await db.syncMetadata.put({
                table: this.companyId,
                lastSyncedAt: response.syncTimestamp,
                companyId: this.companyId
            });

            this.isSyncing = false;
            this.emit({
                type: 'sync:completed',
                data: {
                    changesApplied: response.applied.length,
                    conflicts: response.conflicts.length,
                    serverChanges: response.serverChanges.length
                }
            });

            return true;
        } catch (error) {
            console.error('Sync failed:', error);
            this.isSyncing = false;
            this.emit({ type: 'sync:failed', data: { error: (error as Error).message } });
            return false;
        }
    }

    // ============ PRIVATE HELPERS ============

    private async getLocalRecord(entity: SyncQueueItem['entity'], id: string): Promise<unknown> {
        const table = db[entity];
        return table.get(id);
    }

    private async updateSyncStatus(entity: SyncQueueItem['entity'], id: string, status: SyncStatus): Promise<void> {
        const table = db[entity];
        await table.update(id, { syncStatus: status, updatedAt: getTimestamp() });
    }

    private async updateOfflineIdToServerId(
        entity: SyncQueueItem['entity'],
        offlineId: string,
        serverId: string
    ): Promise<void> {
        const table = db[entity] as unknown as {
            get: (id: string) => Promise<Record<string, unknown> | undefined>;
            delete: (id: string) => Promise<void>;
            add: (item: Record<string, unknown>) => Promise<unknown>;
        };
        const record = await table.get(offlineId);
        if (record) {
            await table.delete(offlineId);
            await table.add({ ...record, id: serverId, syncStatus: 'synced' as SyncStatus });
        }
    }

    private async mergeServerData(entity: SyncQueueItem['entity'], data: Record<string, unknown>): Promise<void> {
        const table = db[entity];
        const id = data.id as string;
        await table.put({
            ...data,
            id,
            syncStatus: 'synced' as SyncStatus,
            updatedAt: getTimestamp()
        } as never);
    }

    private async applyServerChange(change: { entity: string; action: string; data: Record<string, unknown> }): Promise<void> {
        const table = db[change.entity as SyncQueueItem['entity']];
        const id = change.data.id as string;

        switch (change.action) {
            case 'create':
            case 'update':
                await table.put({
                    ...change.data,
                    id,
                    syncStatus: 'synced' as SyncStatus
                } as never);
                break;
            case 'delete':
                await table.delete(id);
                break;
        }
    }

    private async fetchServerChanges(): Promise<void> {
        if (!this.companyId) return;

        try {
            const syncMeta = await db.syncMetadata.get(this.companyId);
            const lastSyncedAt = syncMeta?.lastSyncedAt || null;

            const response = await apiService.post<SyncResponse>('/v1/sync', {
                changes: [],
                lastSyncedAt,
                deviceId: this.deviceId
            });

            // Apply server changes
            for (const serverChange of response.serverChanges) {
                await this.applyServerChange(serverChange);
            }

            // Update last sync timestamp
            await db.syncMetadata.put({
                table: this.companyId,
                lastSyncedAt: response.syncTimestamp,
                companyId: this.companyId
            });
        } catch (error) {
            console.error('Failed to fetch server changes:', error);
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        window.removeEventListener('online', () => { });
        window.removeEventListener('offline', () => { });
    }
}

// ============ SINGLETON EXPORT ============

export const syncService = new SyncService();
export default syncService;
