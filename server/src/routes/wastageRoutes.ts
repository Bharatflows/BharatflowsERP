/**
 * Wastage Routes
 * 
 * API routes for wastage tracking module
 */

import { Router } from 'express';
import { protect } from '../middleware/auth';
import wastageController from '../controllers/wastageController';

const router = Router();

// All routes require authentication
router.use(protect);

// Analytics endpoint (must be before :id route)
router.get('/summary', wastageController.getWastageAnalytics);

// CRUD operations
router.post('/', wastageController.createWastage);
router.get('/', wastageController.listWastages);
router.get('/:id', wastageController.getWastage);

export default router;
