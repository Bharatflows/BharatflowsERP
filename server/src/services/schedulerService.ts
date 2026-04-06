import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { scheduledQueue } from './jobQueue';

const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';
const WORKER_NAME = 'ScheduledTaskWorker';

export const initScheduler = async () => {
    if (!REDIS_ENABLED || !scheduledQueue) {
        logger.info(`[${WORKER_NAME}] Skipped - Redis disabled`);
        return;
    }

    logger.info(`[${WORKER_NAME}] Initializing...`);

    const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null
    };

    const connection = new IORedis(redisConfig);

    // 1. Define Worker Processor
    const worker = new Worker('scheduled-tasks', async (job: Job) => {
        logger.info(`[${WORKER_NAME}] Processing job: ${job.name}`);

        switch (job.name) {
            case 'auto-lock-inactive-users':
                await lockInactiveUsers();
                break;
            default:
                logger.warn(`[${WORKER_NAME}] Unknown job: ${job.name}`);
        }
    }, { connection });

    worker.on('completed', (job) => {
        logger.info(`[${WORKER_NAME}] Job ${job.name} completed.`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`[${WORKER_NAME}] Job ${job?.name} failed:`, err);
    });

    // 2. Schedule Repeatable Jobs
    // Remove existing to avoid duplicates if params changed
    await scheduledQueue.removeRepeatable('auto-lock-inactive-users', {
        pattern: '0 0 * * *' // Daily at midnight
    });

    await scheduledQueue.add('auto-lock-inactive-users', {}, {
        repeat: {
            pattern: '0 0 * * *' // Cron: Every day at 00:00
        }
    });

    logger.info(`[${WORKER_NAME}] Jobs scheduled.`);
};

// ================= JOBS =================

async function lockInactiveUsers() {
    try {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - 90); // 90 days ago

        const result = await prisma.user.updateMany({
            where: {
                lastLogin: { lt: thresholdDate },
                status: 'ACTIVE',
                role: { not: 'OWNER' } // Don't lock owners automatically
            },
            data: {
                status: 'INACTIVE'
            }
        });

        if (result.count > 0) {
            logger.info(`[AutoLock] Locked ${result.count} inactive users.`);
        } else {
            logger.info(`[AutoLock] No inactive users found.`);
        }
    } catch (error) {
        logger.error(`[AutoLock] Error locking users:`, error);
        throw error;
    }
}
