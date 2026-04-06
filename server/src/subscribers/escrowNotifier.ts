/**
 * Escrow Event Notifier
 * Subscribes to escrow domain events and sends notifications
 */
import { eventBus, EventTypes } from '../services/eventBus';
import { notificationService } from '../services/notificationService';
import logger from '../config/logger';

const ESCROW_EVENTS = [
    EventTypes.ESCROW_CREATED,
    EventTypes.ESCROW_RELEASED,
] as const;

interface EscrowEventPayload {
    companyId: string;
    aggregateId: string;
    payload: {
        description?: string;
        buyerId?: string;
        sellerId?: string;
        amount?: number;
        milestoneName?: string;
        status?: string;
        [key: string]: unknown;
    };
    metadata: { userId: string; source: string };
}

const NOTIFICATION_MAP: Record<string, (e: EscrowEventPayload) => { title: string; message: string; type: string }> = {
    ESCROW_CREATED: (e) => ({
        title: 'New Escrow Created',
        message: `Escrow #${e.aggregateId.slice(-6)} created${e.payload.amount ? ` for ₹${Number(e.payload.amount).toLocaleString('en-IN')}` : ''}`,
        type: 'ESCROW_CREATED',
    }),
    ESCROW_RELEASED: (e) => ({
        title: 'Escrow Funds Released',
        message: `Funds released for escrow #${e.aggregateId.slice(-6)}${e.payload.milestoneName ? ` — ${e.payload.milestoneName}` : ''}`,
        type: 'ESCROW_RELEASED',
    }),
};

export function initEscrowNotifier() {
    ESCROW_EVENTS.forEach(eventType => {
        eventBus.subscribe(eventType, async (event) => {
            try {
                const e = event as unknown as EscrowEventPayload;
                const mapper = NOTIFICATION_MAP[eventType];
                if (!mapper) return;

                const { title, message, type } = mapper(e);

                // Notify relevant users (buyer + seller)
                const userIds = [e.payload.buyerId, e.payload.sellerId, e.metadata.userId].filter(Boolean) as string[];
                const uniqueIds = [...new Set(userIds)];

                for (const userId of uniqueIds) {
                    await notificationService.create({
                        userId,
                        companyId: e.companyId,
                        type,
                        title,
                        message,
                        data: { escrowId: e.aggregateId, ...e.payload },
                    });
                }

                logger.info(`[EscrowNotifier] Sent ${type} notifications to ${uniqueIds.length} users`);
            } catch (err: any) {
                logger.error(`[EscrowNotifier] Error processing ${eventType}:`, err.message);
            }
        });
    });

    logger.info('[EscrowNotifier] Subscribed to escrow events');
}
