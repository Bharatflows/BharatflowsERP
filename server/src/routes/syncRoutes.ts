/**
 * Sync Routes
 * 
 * API routes for multi-device synchronization.
 */

import { Router } from 'express';
import { sync, initialSync, getSyncStatus } from '../controllers/syncController';
import { protect } from '../middleware/auth';

const router = Router();

// All sync routes require authentication
router.use(protect);

// Main sync endpoint - process changes and get updates
router.post('/', sync);

// Initial sync - get all data for first-time sync
router.get('/initial', initialSync);

// Sync status check
router.get('/status', getSyncStatus);

export default router;
