/**
 * Offline-Aware Hooks
 * 
 * Custom hooks that provide offline-first data operations.
 * These hooks:
 * - Read from IndexedDB first for instant UI
 * - Sync with server when online
 * - Queue mutations when offline
 * - Provide sync status for UI feedback
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type OfflineParty, type OfflineProduct, type OfflineInvoice, type OfflineEstimate } from '../lib/db';
import { offlineService } from '../services/offlineService';
import { syncService } from '../services/syncService';
import { useNetworkStatus } from '../contexts/NetworkStatusContext';
import { partiesService, productsService, salesService, estimatesService } from '../services/modules.service';

// ============ PARTIES HOOKS ============

export function useOfflineParties(companyId: string) {
    const { isOnline } = useNetworkStatus();
    const queryClient = useQueryClient();

    // Live query from IndexedDB
    const localParties = useLiveQuery(
        async () => {
            if (!companyId) return [];
            return db.parties.where('companyId').equals(companyId).toArray();
        },
        [companyId],
        []
    );

    // Sync with server when online
    const { isLoading: isSyncing } = useQuery({
        queryKey: ['parties', 'sync', companyId],
        queryFn: async () => {
            if (!isOnline) return null;

            try {
                const serverData = await partiesService.getAll();
                // Bulk upsert to local DB
                if (serverData && Array.isArray(serverData)) {
                    await offlineService.bulkUpsert('parties', serverData as unknown as OfflineParty[]);
                }
                return serverData;
            } catch (error) {
                console.error('Failed to sync parties:', error);
                return null;
            }
        },
        enabled: isOnline && !!companyId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (data: Omit<OfflineParty, 'id' | 'syncStatus' | 'syncVersion' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
            const result = await offlineService.createParty(data as Record<string, unknown>, companyId);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parties'] });
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<OfflineParty> }) => {
            const result = await offlineService.updateParty(id, data as Record<string, unknown>);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parties'] });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const result = await offlineService.deleteParty(id);
            if (!result.success) {
                throw new Error(result.error);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parties'] });
        },
    });

    return {
        parties: localParties || [],
        isLoading: localParties === undefined,
        isSyncing,
        isOnline,
        createParty: createMutation.mutateAsync,
        updateParty: updateMutation.mutateAsync,
        deleteParty: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}

// ============ PRODUCTS HOOKS ============

export function useOfflineProducts(companyId: string) {
    const { isOnline } = useNetworkStatus();
    const queryClient = useQueryClient();

    // Live query from IndexedDB
    const localProducts = useLiveQuery(
        async () => {
            if (!companyId) return [];
            return db.products.where('companyId').equals(companyId).toArray();
        },
        [companyId],
        []
    );

    // Sync with server when online
    const { isLoading: isSyncing } = useQuery({
        queryKey: ['products', 'sync', companyId],
        queryFn: async () => {
            if (!isOnline) return null;

            try {
                const serverData = await productsService.getAll();
                if (serverData && Array.isArray(serverData)) {
                    await offlineService.bulkUpsert('products', serverData as unknown as OfflineProduct[]);
                }
                return serverData;
            } catch (error) {
                console.error('Failed to sync products:', error);
                return null;
            }
        },
        enabled: isOnline && !!companyId,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (data: Omit<OfflineProduct, 'id' | 'syncStatus' | 'syncVersion' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
            const result = await offlineService.createProduct(data as Record<string, unknown>, companyId);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<OfflineProduct> }) => {
            const result = await offlineService.updateProduct(id, data as Record<string, unknown>);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const result = await offlineService.deleteProduct(id);
            if (!result.success) {
                throw new Error(result.error);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    return {
        products: localProducts || [],
        isLoading: localProducts === undefined,
        isSyncing,
        isOnline,
        createProduct: createMutation.mutateAsync,
        updateProduct: updateMutation.mutateAsync,
        deleteProduct: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}

// ============ INVOICES HOOKS ============

export function useOfflineInvoices(companyId: string) {
    const { isOnline } = useNetworkStatus();
    const queryClient = useQueryClient();

    // Live query from IndexedDB
    const localInvoices = useLiveQuery(
        async () => {
            if (!companyId) return [];
            return db.invoices.where('companyId').equals(companyId).toArray();
        },
        [companyId],
        []
    );

    // Sync with server when online
    const { isLoading: isSyncing } = useQuery({
        queryKey: ['invoices', 'sync', companyId],
        queryFn: async () => {
            if (!isOnline) return null;

            try {
                const serverData = await salesService.getAll();
                if (serverData && Array.isArray(serverData)) {
                    await offlineService.bulkUpsert('invoices', serverData as unknown as OfflineInvoice[]);
                }
                return serverData;
            } catch (error) {
                console.error('Failed to sync invoices:', error);
                return null;
            }
        },
        enabled: isOnline && !!companyId,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (data: Omit<OfflineInvoice, 'id' | 'syncStatus' | 'syncVersion' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
            const result = await offlineService.createInvoice(data as Record<string, unknown>, companyId);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<OfflineInvoice> }) => {
            const result = await offlineService.updateInvoice(id, data as Record<string, unknown>);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const result = await offlineService.deleteInvoice(id);
            if (!result.success) {
                throw new Error(result.error);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });

    return {
        invoices: localInvoices || [],
        isLoading: localInvoices === undefined,
        isSyncing,
        isOnline,
        createInvoice: createMutation.mutateAsync,
        updateInvoice: updateMutation.mutateAsync,
        deleteInvoice: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}

// ============ ESTIMATES HOOKS ============

export function useOfflineEstimates(companyId: string) {
    const { isOnline } = useNetworkStatus();
    const queryClient = useQueryClient();

    // Live query from IndexedDB
    const localEstimates = useLiveQuery(
        async () => {
            if (!companyId) return [];
            return db.estimates.where('companyId').equals(companyId).toArray();
        },
        [companyId],
        []
    );

    // Sync with server when online
    const { isLoading: isSyncing } = useQuery({
        queryKey: ['estimates', 'sync', companyId],
        queryFn: async () => {
            if (!isOnline) return null;

            try {
                const serverData = await estimatesService.getAll();
                if (serverData && Array.isArray(serverData)) {
                    await offlineService.bulkUpsert('estimates', serverData as unknown as OfflineEstimate[]);
                }
                return serverData;
            } catch (error) {
                console.error('Failed to sync estimates:', error);
                return null;
            }
        },
        enabled: isOnline && !!companyId,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (data: Omit<OfflineEstimate, 'id' | 'syncStatus' | 'syncVersion' | 'createdAt' | 'updatedAt' | 'companyId'>) => {
            const result = await offlineService.createEstimate(data as Record<string, unknown>, companyId);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estimates'] });
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<OfflineEstimate> }) => {
            const result = await offlineService.updateEstimate(id, data as Record<string, unknown>);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estimates'] });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const result = await offlineService.deleteEstimate(id);
            if (!result.success) {
                throw new Error(result.error);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['estimates'] });
        },
    });

    return {
        estimates: localEstimates || [],
        isLoading: localEstimates === undefined,
        isSyncing,
        isOnline,
        createEstimate: createMutation.mutateAsync,
        updateEstimate: updateMutation.mutateAsync,
        deleteEstimate: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}

// ============ INITIAL SYNC HOOK ============

export function useInitialSync(companyId: string) {
    const { isOnline } = useNetworkStatus();

    return useQuery({
        queryKey: ['initialSync', companyId],
        queryFn: async () => {
            if (!companyId) return null;

            try {
                const response = await fetch(`/api/v1/sync/initial`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Initial sync failed');
                }

                const data = await response.json();

                // Populate local database
                await Promise.all([
                    offlineService.bulkUpsert('parties', data.parties || []),
                    offlineService.bulkUpsert('products', data.products || []),
                    offlineService.bulkUpsert('invoices', data.invoices || []),
                    offlineService.bulkUpsert('estimates', data.estimates || []),
                    offlineService.bulkUpsert('salesOrders', data.salesOrders || []),
                    offlineService.bulkUpsert('purchaseOrders', data.purchaseOrders || []),
                ]);

                // Update sync metadata
                await db.syncMetadata.put({
                    table: companyId,
                    lastSyncedAt: data.syncTimestamp,
                    companyId
                });

                return data;
            } catch (error) {
                console.error('Initial sync error:', error);
                throw error;
            }
        },
        enabled: isOnline && !!companyId,
        staleTime: Infinity, // Only run once per session
        retry: 3,
    });
}

// ============ SYNC STATUS HOOK ============

export function useSyncStatus() {
    const { isOnline, isSyncing, pendingChanges, lastSyncedAt, syncError, triggerSync } = useNetworkStatus();

    return {
        isOnline,
        isSyncing,
        pendingChanges,
        lastSyncedAt,
        syncError,
        triggerSync,
        canSync: isOnline && !isSyncing && pendingChanges > 0,
    };
}
