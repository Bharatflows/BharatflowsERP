/**
 * Quality Routes
 * API endpoints for Quality Inspections and Quality Control
 */

import { Router } from 'express';
import qualityController from '../controllers/qualityController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// ==================== Quality Inspection Routes ====================
router.get('/inspections', qualityController.getInspections);
router.get('/inspections/stats', qualityController.getInspectionStats);
router.get('/inspections/:id', qualityController.getInspection);
router.post('/inspections', qualityController.createInspection);
router.put('/inspections/:id', qualityController.updateInspection);
router.delete('/inspections/:id', qualityController.deleteInspection);
router.post('/inspections/:id/complete', qualityController.completeInspection);

// ==================== Checkpoint Routes ====================
// router.put('/checkpoints/:checkpointId/result', qualityController.recordCheckpointResult);

// ==================== Quality Template Routes ====================
// router.get('/templates', qualityController.getQualityTemplates);
// router.post('/templates', qualityController.createQualityTemplate);

export default router;
