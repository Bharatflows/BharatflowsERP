
import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { createEscrow, releaseEscrow, listEscrowTransactions } from '../controllers/escrowController';
import { EscrowMilestoneService } from '../services/escrowMilestoneService';

const router = express.Router();

router.use(protect);

router.post('/', createEscrow);
router.get('/', listEscrowTransactions);
router.post('/:id/release', releaseEscrow);

// Milestone routes
router.post('/:id/milestones', async (req: AuthRequest, res: Response) => {
    try {
        const milestones = await EscrowMilestoneService.addMilestones(req.params.id, req.body.milestones);
        res.status(201).json({ success: true, data: milestones });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.get('/:id/milestones', async (req: AuthRequest, res: Response) => {
    try {
        const milestones = await EscrowMilestoneService.getMilestones(req.params.id);
        res.json({ success: true, data: milestones });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/:id/progress', async (req: AuthRequest, res: Response) => {
    try {
        const data = await EscrowMilestoneService.getEscrowWithProgress(req.params.id);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/milestones/:milestoneId/approve', async (req: AuthRequest, res: Response) => {
    try {
        const { evidence } = req.body;
        const milestone = await EscrowMilestoneService.approveMilestone(
            req.params.milestoneId, req.user.id, evidence
        );
        res.json({ success: true, data: milestone });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/milestones/:milestoneId/release', async (req: AuthRequest, res: Response) => {
    try {
        const result = await EscrowMilestoneService.releaseMilestone(
            req.params.milestoneId, req.user.companyId
        );
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/milestones/:milestoneId/reject', async (req: AuthRequest, res: Response) => {
    try {
        const { reason } = req.body;
        const milestone = await EscrowMilestoneService.rejectMilestone(req.params.milestoneId, reason);
        res.json({ success: true, data: milestone });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/milestones/:milestoneId/reset', async (req: AuthRequest, res: Response) => {
    try {
        const milestone = await EscrowMilestoneService.resetMilestone(req.params.milestoneId);
        res.json({ success: true, data: milestone });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
