/**
 * Decision Engine Routes
 */

import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
    getDecisionInsights,
    getProfitHeatmap,
    getCashLeakageAlerts
} from '../controllers/decisionEngineController';

const router = Router();

// All routes require authentication
router.use(protect);

router.get('/insights', getDecisionInsights);
router.get('/profit-heatmap', getProfitHeatmap);
router.get('/leakage-alerts', getCashLeakageAlerts);

export default router;
