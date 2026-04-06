/**
 * Domain Event Bus Service
 * 
 * P0-5: Event-driven architecture backbone
 * 
 * Responsibilities:
 * - Emit domain events when business state changes
 * - Persist events to DomainEvent table (immutable, append-only)
 * - Allow domains to subscribe to events
 * - Process events asynchronously
 * 
 * Usage:
 *   // Emitting an event
 *   await eventBus.emit({
 *     companyId: 'xxx',
 *     eventType: 'INVOICE_CREATED',
 *     aggregateType: 'Invoice',
 *     aggregateId: invoice.id,
 *     payload: { invoiceNumber: 'INV-001', totalAmount: 1000 },
 *     metadata: { userId: 'xxx', source: 'api' }
 *   });
 * 
 *   // Subscribing to events
 *   eventBus.subscribe('INVOICE_CREATED', async (event) => {
 *     await postingService.postSalesInvoice(event.payload);
 *   });
 */

import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import logger from '../config/logger';

// ============ TYPES ============

export interface DomainEventPayload {
    companyId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    metadata: {
        userId: string;
        deviceId?: string;
        ip?: string;
        source: 'api' | 'sync' | 'system' | 'migration' | 'approvalService';
        timestamp?: string;
    };
}

export interface StoredDomainEvent extends DomainEventPayload {
    id: string;
    version: number;
    createdAt: Date;
    processedAt: Date | null;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    retryCount: number;
    error: string | null;
}

export type EventHandler = (event: StoredDomainEvent) => Promise<void>;

// ============ EVENT TYPES ============

// Define all domain event types for type safety
export const EventTypes = {
    // Identity Domain
    USER_REGISTERED: 'USER_REGISTERED',
    USER_LOGGED_IN: 'USER_LOGGED_IN',
    USER_INVITED: 'USER_INVITED',
    USER_UPDATED: 'USER_UPDATED',
    COMPANY_CREATED: 'COMPANY_CREATED',
    BRANCH_CREATED: 'BRANCH_CREATED',

    // Inventory Domain
    PRODUCT_CREATED: 'PRODUCT_CREATED',
    PRODUCT_UPDATED: 'PRODUCT_UPDATED',
    STOCK_ADJUSTED: 'STOCK_ADJUSTED',
    STOCK_TRANSFERRED: 'STOCK_TRANSFERRED',

    // Sales Domain
    INVOICE_CREATED: 'INVOICE_CREATED',
    INVOICE_UPDATED: 'INVOICE_UPDATED',
    INVOICE_CANCELLED: 'INVOICE_CANCELLED',
    ESTIMATE_CREATED: 'ESTIMATE_CREATED',
    ESTIMATE_UPDATED: 'ESTIMATE_UPDATED',
    QUOTATION_CREATED: 'QUOTATION_CREATED',
    QUOTATION_UPDATED: 'QUOTATION_UPDATED',
    QUOTATION_DELETED: 'QUOTATION_DELETED',
    SALES_ORDER_CREATED: 'SALES_ORDER_CREATED',
    SALES_ORDER_UPDATED: 'SALES_ORDER_UPDATED',
    SALES_ORDER_DELETED: 'SALES_ORDER_DELETED',
    DELIVERY_CHALLAN_CREATED: 'DELIVERY_CHALLAN_CREATED',
    DELIVERY_CHALLAN_UPDATED: 'DELIVERY_CHALLAN_UPDATED',
    DELIVERY_CHALLAN_DELETED: 'DELIVERY_CHALLAN_DELETED',
    CREDIT_NOTE_CREATED: 'CREDIT_NOTE_CREATED',

    // Purchase Domain
    PURCHASE_ORDER_CREATED: 'PURCHASE_ORDER_CREATED',
    PURCHASE_ORDER_UPDATED: 'PURCHASE_ORDER_UPDATED',
    GOODS_RECEIVED: 'GOODS_RECEIVED',
    PURCHASE_BILL_CREATED: 'PURCHASE_BILL_CREATED',
    PURCHASE_BILL_UPDATED: 'PURCHASE_BILL_UPDATED',
    PURCHASE_BILL_CANCELLED: 'PURCHASE_BILL_CANCELLED',
    DEBIT_NOTE_CREATED: 'DEBIT_NOTE_CREATED',
    PURCHASE_ORDER_DELETED: 'PURCHASE_ORDER_DELETED',
    GRN_DELETED: 'GRN_DELETED',

    // Payments Domain
    PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
    PAYMENT_MADE: 'PAYMENT_MADE',
    PDC_CREATED: 'PDC_CREATED',
    PDC_DEPOSITED: 'PDC_DEPOSITED',
    PDC_CLEARED: 'PDC_CLEARED',
    PDC_BOUNCED: 'PDC_BOUNCED',

    // Procurement Domain (Prompt 5)
    RFQ_CREATED: 'RFQ_CREATED',
    RFQ_UPDATED: 'RFQ_UPDATED',
    SUPPLIER_QUOTE_RECEIVED: 'SUPPLIER_QUOTE_RECEIVED',
    // PO_GENERATED can map to PURCHASE_ORDER_CREATED, but if specific logic needed:
    PO_GENERATED_FROM_QUOTE: 'PO_GENERATED_FROM_QUOTE',

    // Group Buying (Prompt 6)
    GROUP_BUY_CREATED: 'GROUP_BUY_CREATED',
    GROUP_BUY_JOINED: 'GROUP_BUY_JOINED',
    GROUP_BUY_FILLED: 'GROUP_BUY_FILLED',

    // Logistics (Prompt 7)
    SHIPMENT_CREATED: 'SHIPMENT_CREATED',
    SHIPMENT_DELIVERED: 'SHIPMENT_DELIVERED',

    // Escrow Domain (Prompt 3)
    ESCROW_CREATED: 'ESCROW_CREATED',
    ESCROW_RELEASED: 'ESCROW_RELEASED',
    ESCROW_DISPUTED: 'ESCROW_DISPUTED',

    // Expense Domain
    EXPENSE_CREATED: 'EXPENSE_CREATED',
    EXPENSE_UPDATED: 'EXPENSE_UPDATED',
    EXPENSE_APPROVED: 'EXPENSE_APPROVED',

    // Party Domain
    PARTY_CREATED: 'PARTY_CREATED',
    PARTY_UPDATED: 'PARTY_UPDATED',

    // P0: Stock Adjustment
    STOCK_ADJUSTMENT_CREATED: 'STOCK_ADJUSTMENT_CREATED',
    STOCK_ADJUSTMENT_REVERSED: 'STOCK_ADJUSTMENT_REVERSED',

    // Phase 9: Wastage Recording
    WASTAGE_RECORDED: 'WASTAGE_RECORDED',

    // P0: Approval Workflow
    APPROVAL_REQUESTED: 'APPROVAL_REQUESTED',
    APPROVAL_GRANTED: 'APPROVAL_GRANTED',
    APPROVAL_REJECTED: 'APPROVAL_REJECTED',

    // Production Domain
    WORK_ORDER_CREATED: 'WORK_ORDER_CREATED',
    WORK_ORDER_UPDATED: 'WORK_ORDER_UPDATED',
    WORK_ORDER_DELETED: 'WORK_ORDER_DELETED',
    WORK_ORDER_COMPLETED: 'WORK_ORDER_COMPLETED',
    BOM_CREATED: 'BOM_CREATED',
    BOM_UPDATED: 'BOM_UPDATED',
    BOM_DELETED: 'BOM_DELETED',
    MANUFACTURING_RUN_COMPLETED: 'MANUFACTURING_RUN_COMPLETED',

    // Compliance Domain
    GST_RETURN_FILED: 'GST_RETURN_FILED',
    GST_PAYMENT_MADE: 'GST_PAYMENT_MADE',
    EWAY_BILL_CREATED: 'EWAY_BILL_CREATED',

    // CRM Domain
    LEAD_CREATED: 'LEAD_CREATED',
    LEAD_UPDATED: 'LEAD_UPDATED',
    LEAD_STATUS_CHANGED: 'LEAD_STATUS_CHANGED',
    LEAD_CONVERTED: 'LEAD_CONVERTED',

    // Banking Domain
    BANK_ACCOUNT_CREATED: 'BANK_ACCOUNT_CREATED',
    BANK_TRANSACTION_CREATED: 'BANK_TRANSACTION_CREATED',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

// ============ EVENT BUS CLASS ============

class EventBus {
    private handlers: Map<string, Set<EventHandler>> = new Map();
    private isProcessing: boolean = false;

    /**
     * Emit a domain event
     * 
     * This persists the event to the database and triggers handlers.
     * Events are immutable once created - they are never updated or deleted.
     */
    async emit(eventPayload: DomainEventPayload, prismaArg?: any): Promise<StoredDomainEvent> {
        // Ensure timestamp in metadata
        const metadata = {
            ...eventPayload.metadata,
            timestamp: eventPayload.metadata.timestamp || new Date().toISOString(),
        };

        // Persist event to database (immutable, append-only)
        // SUPPORT TRANSACTIONAL EMIT
        const db = (prismaArg as any) || prisma;

        const event = await db.domainEvent.create({
            data: {
                companyId: eventPayload.companyId,
                eventType: eventPayload.eventType,
                aggregateType: eventPayload.aggregateType,
                aggregateId: eventPayload.aggregateId,
                payload: JSON.stringify(eventPayload.payload),
                metadata: JSON.stringify(metadata),
                version: 1,
                status: 'PENDING', // Start as PENDING
            },
        });

        logger.info(`[EventBus] Emitted: ${event.eventType} for ${event.aggregateType}:${event.aggregateId}`);

        // Process handlers asynchronously (fire-and-forget for now)
        // In production, this should use a proper job queue
        setImmediate(() => this.processEvent(event as unknown as StoredDomainEvent));

        return event as unknown as StoredDomainEvent;
    }

    /**
     * Emit multiple events in a transaction
     * 
     * Useful when a business operation creates multiple state changes.
     */
    async emitBatch(events: DomainEventPayload[]): Promise<StoredDomainEvent[]> {
        const timestamp = new Date().toISOString();

        const createdEvents = await prisma.$transaction(
            events.map((eventPayload) =>
                prisma.domainEvent.create({
                    data: {
                        companyId: eventPayload.companyId,
                        eventType: eventPayload.eventType,
                        aggregateType: eventPayload.aggregateType,
                        aggregateId: eventPayload.aggregateId,
                        payload: JSON.stringify(eventPayload.payload),
                        metadata: JSON.stringify({
                            ...eventPayload.metadata,
                            timestamp: eventPayload.metadata.timestamp || timestamp,
                        }),
                        version: 1,
                        status: 'PENDING',
                    },
                })
            )
        );

        logger.info(`[EventBus] Emitted batch of ${createdEvents.length} events`);

        // Process handlers for each event
        for (const event of createdEvents) {
            setImmediate(() => this.processEvent(event as unknown as StoredDomainEvent));
        }

        return createdEvents as unknown as StoredDomainEvent[];
    }

    /**
     * Subscribe to a specific event type
     * 
     * Handlers are called asynchronously when events of this type are emitted.
     * Multiple handlers can subscribe to the same event type.
     */
    subscribe(eventType: string, handler: EventHandler): () => void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }

        this.handlers.get(eventType)!.add(handler);
        logger.info(`[EventBus] Handler subscribed to: ${eventType}`);

        // Return unsubscribe function
        return () => {
            this.handlers.get(eventType)?.delete(handler);
        };
    }

    /**
     * Subscribe to multiple event types with the same handler
     */
    subscribeMany(eventTypes: string[], handler: EventHandler): () => void {
        const unsubscribers = eventTypes.map((type) => this.subscribe(type, handler));
        return () => unsubscribers.forEach((unsub) => unsub());
    }

    /**
     * Process an event by calling all registered handlers
     */
    private async processEvent(event: StoredDomainEvent): Promise<void> {
        const handlers = this.handlers.get(event.eventType);

        if (!handlers || handlers.size === 0) {
            // No handlers registered, mark as processed anyway
            await this.markProcessed(event.id);
            return;
        }

        const errors: Error[] = [];

        for (const handler of handlers) {
            try {
                await handler(event);
            } catch (error) {
                logger.error(`[EventBus] Handler error for ${event.eventType}:`, error);
                errors.push(error as Error);
            }
        }

        // Mark as processed even if some handlers failed
        // Failed handlers should be retried via separate mechanism
        // If errors occurred, mark as FAILED (or partial success if we separate handlers)
        // For now, if ANY handler fails, we mark as FAILED to retry.
        // But since we catch errors in loop, we need to decide strategy.
        // Simple strategy: If any error, log it and mark FAILED.
        if (errors.length > 0) {
            logger.warn(`[EventBus] ${errors.length} handler(s) failed for event ${event.id}`);
            await this.markFailed(event.id, errors.map(e => e.message).join('; '));
        } else {
            await this.markProcessed(event.id);
        }
    }

    /**
     * Mark an event as processed (COMPLETED)
     */
    private async markProcessed(eventId: string): Promise<void> {
        await prisma.domainEvent.update({
            where: { id: eventId },
            data: {
                status: 'COMPLETED',
                processedAt: new Date(),
                lockedUntil: null
            },
        });
    }

    /**
     * Mark an event as failed
     */
    private async markFailed(eventId: string, error: string): Promise<void> {
        await prisma.domainEvent.update({
            where: { id: eventId },
            data: {
                status: 'FAILED',
                failedAt: new Date(),
                error: error,
                retryCount: { increment: 1 },
                lockedUntil: null
            },
        });
    }

    /**
     * Process pending events (Poller)
     */
    async processPendingEvents(limit: number = 20): Promise<number> {
        if (this.isProcessing) return 0;
        this.isProcessing = true;
        let processedCount = 0;

        try {
            const now = new Date();
            // Find candidates: PENDING, or FAILED < 5 retries, or stuck PROCESSING
            const candidates = await prisma.domainEvent.findMany({
                where: {
                    OR: [
                        { status: 'PENDING' },
                        { status: 'FAILED', retryCount: { lt: 5 } },
                        { status: 'PROCESSING', lockedUntil: { lt: now } }
                    ]
                },
                orderBy: { createdAt: 'asc' },
                take: limit
            });

            for (const candidate of candidates) {
                // Try to acquire lock
                const lockedEvent = await prisma.domainEvent.updateMany({
                    where: {
                        id: candidate.id,
                        version: candidate.version // Optimistic concurrency
                    },
                    data: {
                        status: 'PROCESSING',
                        lockedUntil: new Date(now.getTime() + 5 * 60 * 1000), // Lock for 5 mins
                        version: { increment: 1 }
                    }
                });

                if (lockedEvent.count === 0) continue; // Lost race or changed

                // Re-fetch to get updated object (optional, but cast is safe enough for payload)
                const eventToProcess = { ...candidate, status: 'PROCESSING' } as unknown as StoredDomainEvent;
                await this.processEvent(eventToProcess);
                processedCount++;
            }
        } catch (error) {
            logger.error('[EventBus] Error in processPendingEvents:', error);
        } finally {
            this.isProcessing = false;
        }

        return processedCount;
    }
    async getUnprocessedEvents(companyId?: string, limit: number = 100): Promise<StoredDomainEvent[]> {
        const where: Prisma.DomainEventWhereInput = {
            status: { in: ['PENDING', 'FAILED'] }, // Pick up failed ones for retry too? Or just PENDING?
            // For now, let's stick to PENDING. Failed ones need manual intervention or separate retry logic.
            // status: 'PENDING', 
            processedAt: null,
            ...(companyId && { companyId }),
        };

        return prisma.domainEvent.findMany({
            where,
            orderBy: { createdAt: 'asc' },
            take: limit,
        }) as unknown as Promise<StoredDomainEvent[]>;
    }

    /**
     * Replay events for an aggregate (useful for rebuilding state)
     */
    async replayEvents(
        aggregateType: string,
        aggregateId: string,
        handler: EventHandler
    ): Promise<number> {
        const events = await prisma.domainEvent.findMany({
            where: { aggregateType, aggregateId },
            orderBy: { createdAt: 'asc' },
        });

        for (const event of events) {
            await handler(event as unknown as StoredDomainEvent);
        }

        return events.length;
    }

    /**
     * Get event history for an aggregate
     */
    async getEventHistory(
        aggregateType: string,
        aggregateId: string
    ): Promise<StoredDomainEvent[]> {
        return prisma.domainEvent.findMany({
            where: { aggregateType, aggregateId },
            orderBy: { createdAt: 'asc' },
        }) as unknown as Promise<StoredDomainEvent[]>;
    }
}

// ============ SINGLETON EXPORT ============

export const eventBus = new EventBus();
export default eventBus;
