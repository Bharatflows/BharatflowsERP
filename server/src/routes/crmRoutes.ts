import express from 'express';
import { protect } from '../middleware/auth';
import {
    createLead,
    getLeads,
    updateLeadStatus,
    addActivity,
    getActivities
} from '../controllers/crmController';

const router = express.Router();

router.use(protect);

// Lead Management
router.post('/leads', createLead);
router.get('/leads', getLeads);
router.put('/leads/:id/status', updateLeadStatus);

// Activity Logging
router.post('/activities', addActivity);
router.get('/activities', getActivities);

export default router;
