import express from 'express';
import { protect } from '../middleware/auth';
import {
    createLead,
    getLeads,
    getLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
    addActivity,
    getActivities,
    getDashboard,
    getSalesFunnel,
    recalculateScore
} from '../controllers/crmController';

const router = express.Router();

router.use(protect);

// Dashboard
router.get('/dashboard', getDashboard);
router.get('/funnel', getSalesFunnel);

// Lead Management
router.route('/leads')
    .get(getLeads)
    .post(createLead);

router.route('/leads/:id')
    .get(getLead)
    .put(updateLead)
    .delete(deleteLead);

router.put('/leads/:id/status', updateLeadStatus);

// Activity Logging
router.post('/activities', addActivity);
router.get('/activities', getActivities);

// Customer Scoring (Phase 11)
router.post('/scores/:customerId', recalculateScore);

export default router;
