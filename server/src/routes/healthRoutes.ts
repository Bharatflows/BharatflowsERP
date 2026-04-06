/**
 * Health Check Routes
 * 
 * H5 FIX: Provides health and readiness endpoints for deployment monitoring
 */

import { Router, Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';

const router = Router();

/**
 * @desc    Basic health check - returns ok if server is running
 * @route   GET /api/v1/health
 * @access  Public
 */
router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime()
    });
});

/**
 * @desc    Readiness check - verifies database connectivity
 * @route   GET /api/v1/ready
 * @access  Public
 */
router.get('/ready', async (req: Request, res: Response) => {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            status: 'ready',
            database: true,
            timestamp: Date.now()
        });
    } catch (error: any) {
        logger.error('Readiness check failed:', error.message);
        res.status(503).json({
            status: 'not ready',
            database: false,
            error: 'Database connection failed',
            timestamp: Date.now()
        });
    }
});

/**
 * @desc    Liveness check - simple ping
 * @route   GET /api/v1/ping
 * @access  Public
 */
router.get('/ping', (req: Request, res: Response) => {
    res.send('pong');
});

export default router;
