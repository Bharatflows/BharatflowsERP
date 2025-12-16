/**
 * IndexedDB Database Schema using Dexie.js
 * 
 * This provides offline storage for the BharatFlow application,
 * enabling multi-device synchronization and offline-first capabilities.
 */

import Dexie, { type EntityTable } from 'dexie';

// ============ SYNC STATUS TYPES ============
export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'error';

// ============ OFFLINE ENTITY INTERFACES ============

export interface OfflineParty {
    id: string;
    name: string;
    type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
    gstin?: string;
    pan?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    creditLimit?: number;
    openingBalance?: number;
    companyId: string;
    // Sync metadata
    syncStatus: SyncStatus;
    syncVersion: number;
    updatedAt: string;
    createdAt: string;
    lastModifiedBy?: string;
}

export interface OfflineProduct {
    id: string;
    name: string;
    code?: string;
    hsnCode?: string;
    description?: string;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    taxRate: number;
    currentStock: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    companyId: string;
    // Sync metadata
    syncStatus: SyncStatus;
    syncVersion: number;
    updatedAt: string;
    createdAt: string;
    lastModifiedBy?: string;
}

export interface OfflineInvoice {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    partyId: string;
    partyName: string;
    subtotal: number;
    totalTax: number;
    totalAmount: number;
    paidAmount: number;
    status: string;
    items: OfflineInvoiceItem[];
    notes?: string;
    termsAndConditions?: string;
    companyId: string;
    // Sync metadata
    syncStatus: SyncStatus;
    syncVersion: number;
    updatedAt: string;
    createdAt: string;
    lastModifiedBy?: string;
}

export interface OfflineInvoiceItem {
    id: string;
    productId?: string;
    productName: string;
    description?: string;
    quantity: number;
    rate: number;
    taxRate: number;
    taxAmount: number;
    total: number;
}

export interface OfflineEstimate {
    id: string;
    estimateNumber: string;
    estimateDate: string;
    validUntil?: string;
    partyId: string;
    partyName: string;
    subtotal: number;
    totalTax: number;
    totalAmount: number;
    status: string;
    items: OfflineInvoiceItem[];
    notes?: string;
    termsAndConditions?: string;
    companyId: string;
    // Sync metadata
    syncStatus: SyncStatus;
    syncVersion: number;
    updatedAt: string;
    createdAt: string;
    lastModifiedBy?: string;
}

export interface OfflineSalesOrder {
    id: string;
    orderNumber: string;
    orderDate: string;
    expectedDate?: string;
    partyId: string;
    partyName: string;
    subtotal: number;
    totalTax: number;
    totalAmount: number;
    status: string;
    items: OfflineInvoiceItem[];
    notes?: string;
    companyId: string;
    // Sync metadata
    syncStatus: SyncStatus;
    syncVersion: number;
    updatedAt: string;
    createdAt: string;
    lastModifiedBy?: string;
}

export interface OfflinePurchaseOrder {
    id: string;
    orderNumber: string;
    orderDate: string;
    expectedDate?: string;
    partyId: string;
    partyName: string;
    subtotal: number;
    totalTax: number;
    totalAmount: number;
    status: string;
    items: OfflineInvoiceItem[];
    notes?: string;
    companyId: string;
    // Sync metadata
    syncStatus: SyncStatus;
    syncVersion: number;
    updatedAt: string;
    createdAt: string;
    lastModifiedBy?: string;
}

// ============ SYNC QUEUE ============

export interface OfflinePOSOrder {
    id: string;
    orderNumber: string;
    sessionId: string;
    items: {
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    paymentMode: string;
    companyId: string;
    // Sync metadata
    syncStatus: SyncStatus;
    syncVersion: number;
    updatedAt: string;
    createdAt: string;
}

export interface SyncQueueItem {
    id?: number; // Auto-incremented
    entity: 'parties' | 'products' | 'invoices' | 'estimates' | 'salesOrders' | 'purchaseOrders' | 'posOrders';
    action: 'create' | 'update' | 'delete';
    entityId: string;
    data: Record<string, unknown>;
    createdAt: string;
    retryCount: number;
    lastError?: string;
}

// ============ SYNC METADATA ============

export interface SyncMetadata {
    table: string;
    lastSyncedAt: string;
    companyId: string;
}

// ============ DATABASE CLASS ============

class BharatFlowDB extends Dexie {
    // Typed tables
    parties!: EntityTable<OfflineParty, 'id'>;
    products!: EntityTable<OfflineProduct, 'id'>;
    invoices!: EntityTable<OfflineInvoice, 'id'>;
    estimates!: EntityTable<OfflineEstimate, 'id'>;
    salesOrders!: EntityTable<OfflineSalesOrder, 'id'>;
    purchaseOrders!: EntityTable<OfflinePurchaseOrder, 'id'>;
    posOrders!: EntityTable<OfflinePOSOrder, 'id'>;
    syncQueue!: EntityTable<SyncQueueItem, 'id'>;
    syncMetadata!: EntityTable<SyncMetadata, 'table'>;

    constructor() {
        super('BharatFlowDB');

        // Version 1: Initial schema
        this.version(1).stores({
            // Primary key is 'id', indexed fields for queries
            parties: 'id, name, type, companyId, syncStatus, updatedAt',
            products: 'id, name, code, companyId, syncStatus, updatedAt',
            invoices: 'id, invoiceNumber, partyId, companyId, status, syncStatus, updatedAt',
            estimates: 'id, estimateNumber, partyId, companyId, status, syncStatus, updatedAt',
            salesOrders: 'id, orderNumber, partyId, companyId, status, syncStatus, updatedAt',
            purchaseOrders: 'id, orderNumber, partyId, companyId, status, syncStatus, updatedAt',
            // Sync queue uses auto-incremented id
            syncQueue: '++id, entity, action, entityId, createdAt',
            // Sync metadata is keyed by table name
            syncMetadata: 'table, companyId'
        });

        // Version 2: Add POS Orders
        this.version(2).stores({
            posOrders: 'id, orderNumber, sessionId, companyId, syncStatus, updatedAt'
        });
    }
}

// ============ DATABASE INSTANCE ============

export const db = new BharatFlowDB();

// ============ HELPER FUNCTIONS ============

/**
 * Generate a UUID for offline record creation
 */
export function generateOfflineId(): string {
    return `offline_${crypto.randomUUID()}`;
}

/**
 * Check if an ID was generated offline
 */
export function isOfflineId(id: string): boolean {
    return id.startsWith('offline_');
}

/**
 * Get current timestamp in ISO format
 */
export function getTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Clear all local data (useful for logout)
 */
export async function clearAllLocalData(): Promise<void> {
    await db.parties.clear();
    await db.products.clear();
    await db.invoices.clear();
    await db.estimates.clear();
    await db.salesOrders.clear();
    await db.purchaseOrders.clear();
    await db.syncQueue.clear();
    await db.syncMetadata.clear();
}

/**
 * Get count of pending sync items
 */
export async function getPendingSyncCount(): Promise<number> {
    return db.syncQueue.count();
}

/**
 * Get all pending sync items for a specific entity
 */
export async function getPendingChangesForEntity(
    entity: SyncQueueItem['entity']
): Promise<SyncQueueItem[]> {
    return db.syncQueue.where('entity').equals(entity).toArray();
}

export default db;
