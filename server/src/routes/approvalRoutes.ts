/**
 * Approval Routes
 * 
 * P0: API routes for document approval workflow
 */

import { Router } from 'express';
import { protect, ProtectedRequest } from '../middleware/auth';
import { approvalService } from '../services/approvalService';
import { workflowService } from '../services/workflowService';
import logger from '../config/logger';

const router = Router();

// Apply auth middleware
router.use(protect);

// Apply auth middleware
router.use(protect);

/**
 * Get pending approvals for the current user
 */
router.get('/pending', async (req, res) => {
    try {
        const { companyId } = (req as unknown as ProtectedRequest).user;

        const pendingApprovals = await approvalService.getPendingApprovals(companyId);

        res.json({
            success: true,
            data: pendingApprovals
        });
    } catch (error: any) {
        logger.error('Get pending approvals error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching pending approvals'
        });
    }
});

/**
 * Request approval for a document
 */
router.post('/request', async (req, res) => {
    try {
        const { companyId, id: userId } = (req as unknown as ProtectedRequest).user;
        const { entityType, entityId, amount, notes } = req.body;

        if (!entityType || !entityId) {
            return res.status(400).json({
                success: false,
                message: 'entityType and entityId are required'
            });
        }

        const result = await approvalService.requestApproval({
            companyId,
            entityType,
            entityId,
            requestedById: userId,
            amount: amount ? Number(amount) : undefined,
            approverRole: 'ADMIN' // Default
        });

        return res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        logger.error('Request approval error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error requesting approval'
        });
    }
});

/**
 * Approve a document
 */
router.post('/:id/approve', async (req, res) => {
    try {
        const { id: userId } = (req as unknown as ProtectedRequest).user;
        const { comments } = req.body;
        const requestId = req.params.id;

        const result = await approvalService.approve(requestId, userId, comments);

        return res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        logger.error('Approve document error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error approving document'
        });
    }
});

/**
 * Reject a document
 */
router.post('/:id/reject', async (req, res) => {
    try {
        const { id: userId } = (req as unknown as ProtectedRequest).user;
        const { reason } = req.body;
        const requestId = req.params.id;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'start reason is required for rejection'
            });
        }

        const result = await approvalService.reject(requestId, userId, reason);

        return res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        logger.error('Reject document error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error rejecting document'
        });
    }
});

// ... existing routes ...

/**
 * Get all configured workflows
 */
router.get('/workflows', async (req, res) => {
    try {
        const { companyId } = (req as unknown as ProtectedRequest).user;
        const workflows = await workflowService.listWorkflows(companyId);
        res.json({ success: true, data: workflows });
    } catch (error: any) {
        logger.error('List workflows error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Create or Update a workflow
 */
router.post('/workflows', async (req, res) => {
    try {
        const { companyId } = (req as unknown as ProtectedRequest).user;
        const result = await workflowService.upsertWorkflow(companyId, req.body);
        res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Upsert workflow error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Delete a workflow
 */
router.delete('/workflows/:id', async (req, res) => {
    try {
        const { companyId } = (req as unknown as ProtectedRequest).user;
        await workflowService.deleteWorkflow(companyId, req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        logger.error('Delete workflow error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
