/**
 * Manufacturing Routes
 * API endpoints for BOM, Work Orders, and Job Cards
 */

import { Router } from 'express';
import { bomController, workOrderController, jobCardController } from '../controllers/manufacturing';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// ==================== BOM Routes ====================
router.get('/bom', bomController.getBOMs);
router.get('/bom/:id', bomController.getBOM);
router.post('/bom', bomController.createBOM);
router.put('/bom/:id', bomController.updateBOM);
router.delete('/bom/:id', bomController.deleteBOM);
router.post('/bom/:id/items', bomController.addBOMItem);
router.put('/bom/items/:itemId', bomController.updateBOMItem);
router.delete('/bom/items/:itemId', bomController.deleteBOMItem);
router.post('/bom/:id/copy', bomController.copyBOM);
// router.post('/bom/:id/set-default', bomController.setDefaultBOM);

// ==================== Work Order Routes ====================
router.get('/work-orders', workOrderController.getWorkOrders);
router.get('/work-orders/:id', workOrderController.getWorkOrder);
router.post('/work-orders', workOrderController.createWorkOrder);
router.put('/work-orders/:id', workOrderController.updateWorkOrder);
router.delete('/work-orders/:id', workOrderController.deleteWorkOrder);
router.post('/work-orders/:id/start', workOrderController.startWorkOrder);
router.post('/work-orders/:id/complete', workOrderController.completeWorkOrder);
router.post('/work-orders/:id/cancel', workOrderController.cancelWorkOrder);
router.get('/work-orders/:id/material-requirements', workOrderController.getMaterialRequirements);

// ==================== Job Card Routes ====================
router.get('/job-cards', jobCardController.getJobCards);
router.get('/job-cards/:id', jobCardController.getJobCard);
router.post('/job-cards', jobCardController.createJobCard);
router.put('/job-cards/:id', jobCardController.updateJobCard);
router.post('/job-cards/:id/start', jobCardController.startJobCard);
router.post('/job-cards/:id/pause', jobCardController.pauseJobCard);
router.post('/job-cards/:id/complete', jobCardController.completeJobCard);
router.post('/job-cards/:id/time-log', jobCardController.logTime);
// router.post('/job-cards/:id/scrap', jobCardController.recordScrap);

export default router;
