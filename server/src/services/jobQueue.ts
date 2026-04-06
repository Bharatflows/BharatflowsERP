import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../config/logger';

const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

let connection: IORedis | null = null;

if (REDIS_ENABLED) {
    const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null
    };

    connection = new IORedis(redisConfig);

    connection.on('error', (err) => {
        logger.warn('Redis connection error:', err.message);
    });

    connection.on('ready', () => {
        logger.info('✅ Redis connected for Job Queues');
    });
} else {
    logger.info('⏭️ Redis disabled - job queues will not be available');
}

export const pdfQueue = connection ? new Queue('pdf-generation', { connection }) : null;
export const emailQueue = connection ? new Queue('email-sending', { connection }) : null;
export const reportQueue = connection ? new Queue('report-generation', { connection }) : null;
export const scheduledQueue = connection ? new Queue('scheduled-tasks', { connection }) : null;

export const closeQueues = async () => {
    if (!connection) return;
    if (pdfQueue) await pdfQueue.close();
    if (emailQueue) await emailQueue.close();
    if (reportQueue) await reportQueue.close();
    if (scheduledQueue) await scheduledQueue.close();
    await connection.quit();
};
