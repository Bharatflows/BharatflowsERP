/**
 * Network Status Context
 * 
 * Provides network status and sync information to the entire application.
 * Components can use this to show online/offline indicators and sync status.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import syncService, { type SyncEvent } from '../services/syncService';
import { db } from '../lib/db';

// ============ TYPES ============

export interface NetworkStatusContextType {
    isOnline: boolean;
    isSyncing: boolean;
    pendingChanges: number;
    lastSyncedAt: Date | null;
    syncError: string | null;
    triggerSync: () => Promise<void>;
}

// ============ CONTEXT ============

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

// ============ PROVIDER ============

interface NetworkStatusProviderProps {
    children: ReactNode;
    companyId?: string;
}

export function NetworkStatusProvider({ children, companyId }: NetworkStatusProviderProps) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingChanges, setPendingChanges] = useState(0);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);

    // Update pending changes count
    const updatePendingCount = useCallback(async () => {
        const count = await db.syncQueue.count();
        setPendingChanges(count);
    }, []);

    // Load last synced timestamp
    const loadLastSyncedAt = useCallback(async () => {
        if (!companyId) return;
        const meta = await db.syncMetadata.get(companyId);
        if (meta?.lastSyncedAt) {
            setLastSyncedAt(new Date(meta.lastSyncedAt));
        }
    }, [companyId]);

    // Set company ID for sync service
    useEffect(() => {
        if (companyId) {
            syncService.setCompanyId(companyId);
            loadLastSyncedAt();
        }
    }, [companyId, loadLastSyncedAt]);

    // Subscribe to sync events
    useEffect(() => {
        const unsubscribe = syncService.subscribe((event: SyncEvent) => {
            switch (event.type) {
                case 'network:online':
                    setIsOnline(true);
                    break;
                case 'network:offline':
                    setIsOnline(false);
                    break;
                case 'sync:started':
                    setIsSyncing(true);
                    setSyncError(null);
                    break;
                case 'sync:completed':
                    setIsSyncing(false);
                    setLastSyncedAt(new Date());
                    updatePendingCount();
                    break;
                case 'sync:failed':
                    setIsSyncing(false);
                    setSyncError((event.data?.error as string) || 'Sync failed');
                    break;
                case 'queue:changed':
                    updatePendingCount();
                    break;
            }
        });

        // Initial count
        updatePendingCount();

        return unsubscribe;
    }, [updatePendingCount]);

    // Listen for browser online/offline events
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Manual sync trigger
    const triggerSync = useCallback(async () => {
        if (!isOnline || isSyncing) return;
        await syncService.sync();
    }, [isOnline, isSyncing]);

    const value: NetworkStatusContextType = {
        isOnline,
        isSyncing,
        pendingChanges,
        lastSyncedAt,
        syncError,
        triggerSync
    };

    return (
        <NetworkStatusContext.Provider value={value}>
            {children}
        </NetworkStatusContext.Provider>
    );
}

// ============ HOOK ============

export function useNetworkStatus(): NetworkStatusContextType {
    const context = useContext(NetworkStatusContext);
    if (context === undefined) {
        throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
    }
    return context;
}

export default NetworkStatusContext;
