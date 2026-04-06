/**
 * Support Routes
 * API endpoints for Support Tickets and Helpdesk
 */

import { Router } from 'express';
import supportController from '../controllers/supportController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// ==================== Ticket Routes ====================
router.get('/tickets', supportController.getIssues);
// router.get('/tickets/my', supportController.getMyIssues);
// router.get('/tickets/stats', supportController.getIssueStats);
router.get('/tickets/:id', supportController.getIssue);
router.post('/tickets', supportController.createIssue);
router.put('/tickets/:id', supportController.updateIssue);
router.delete('/tickets/:id', supportController.deleteIssue);

// ==================== Ticket Actions ====================
router.post('/tickets/:id/assign', supportController.assignIssue);
router.post('/tickets/:id/resolve', supportController.resolveIssue);
router.post('/tickets/:id/close', supportController.closeIssue);
router.post('/tickets/:id/reopen', supportController.reopenIssue);

// ==================== Ticket Comments ====================
router.post('/tickets/:id/comments', supportController.addComment);

export default router;
