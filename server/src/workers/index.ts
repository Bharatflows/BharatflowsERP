import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../config/logger';
import { sendEmail } from '../services/emailService';
import eventWorker from './eventWorker';
import { scheduledQueue } from '../services/jobQueue';

const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

export const initializeWorkers = () => {
    // Start Domain Event Poller (Durable Events) - always runs
    eventWorker.start();

    if (!REDIS_ENABLED) {
        logger.info('⏭️ Redis disabled - background workers skipped');
        return;
    }

    // Shared Redis connection for Workers
    const connection = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null
    });

    const pdfWorker = new Worker('pdf-generation', async (job) => {
        logger.info(`Processing PDF job ${job.id}`);
        // Simulate PDF generation
        await new Promise(resolve => setTimeout(resolve, 5000));
        logger.info(`PDF generated for ${job.data.invoiceId}`);
    }, { connection });

    // Email Worker
    const emailWorker = new Worker('email-sending', async (job) => {
        logger.info(`Processing Email job ${job.id}`);
        const { to, subject, html, attachments } = job.data;
        if (!to || !subject || !html) {
            throw new Error('Missing required email fields');
        }
        await sendEmail({ to, subject, html, attachments });
        logger.info(`Email sent to ${to}`);
    }, { connection });

    const reportWorker = new Worker('report-generation', async (job) => {
        logger.info(`Processing Report job ${job.id}`);
        // Call report logic
        await new Promise(resolve => setTimeout(resolve, 2000));
    }, { connection });

    // I4: Recurring Invoices Worker
    const scheduledWorker = new Worker('scheduled-tasks', async (job) => {
        logger.info(`Processing Scheduled job ${job.id}: ${job.name}`);
        if (job.name === 'check-recurring-invoices') {
            const { RecurringInvoiceService } = await import('../services/recurringInvoiceService');
            const results = await RecurringInvoiceService.processDueProfiles();
            logger.info(`Processed ${results.length} recurring invoices`);
            return results;
        }
        return Promise.resolve();
    }, { connection });

    // Seed repeatable jobs
    const seedScheduledJobs = async () => {
        if (!scheduledQueue) return;
        // Remove old repeatable jobs to avoid duplicates on restart
        const repeatableJobs = await scheduledQueue.getRepeatableJobs();
        for (const job of repeatableJobs) {
            await scheduledQueue.removeRepeatableByKey(job.key);
        }

        // Add daily check (Every day at 00:00)
        await scheduledQueue.add('check-recurring-invoices', {}, {
            repeat: { pattern: '0 0 * * *' },
            removeOnComplete: true
        });
        logger.info('⏰ Recurring invoice check scheduled (Daily @ 00:00)');
    };

    seedScheduledJobs();

    pdfWorker.on('failed', (job, err) => {
        logger.error(`PDF job ${job?.id} failed:`, err);
    });

    logger.info('👷 Background Workers Initialized');
};
