import eventBus from '../services/eventBus';
import logger from '../config/logger';

/**
 * Event Worker
 * 
 * Periodically polls for pending or failed domain events and processes them.
 * Ensures reliability of the event-driven architecture.
 */
class EventWorker {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private readonly POLL_INTERVAL = 10000; // 10 seconds

    /**
     * Start the worker
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        logger.info('[EventWorker] Starting domain event poller...');

        // Run immediately
        this.run();

        // Then every X seconds
        this.intervalId = setInterval(() => this.run(), this.POLL_INTERVAL);
    }

    /**
     * Stop the worker (graceful shutdown)
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        logger.info('[EventWorker] Stopped domain event poller');
    }

    private async run() {
        try {
            const count = await eventBus.processPendingEvents(50);
            if (count > 0) {
                logger.debug(`[EventWorker] Processed ${count} events`);
            }
        } catch (error) {
            logger.error('[EventWorker] Error processing events:', error);
        }
    }
}

export default new EventWorker();
