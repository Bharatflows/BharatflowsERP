/**
 * PDC Routes
 * 
 * Routes for Post-Dated Cheque management.
 */

import { Router } from 'express';
import { protect } from '../middleware/auth';
import * as pdcController from '../controllers/pdcController';

const router = Router();

// Protect all routes
router.use(protect);

// PDC CRUD + Actions
router.get('/reminders', pdcController.getPDCReminders);
router.get('/', pdcController.getPDCs);
router.get('/:id', pdcController.getPDC);
router.post('/', pdcController.createPDC);
router.post('/:id/deposit', pdcController.depositPDC);
router.post('/:id/clear', pdcController.clearPDC);
router.post('/:id/bounce', pdcController.bouncePDC);

export default router;
