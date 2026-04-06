/**
 * Financial Year Routes
 * 
 * P0: Routes for financial year management and period locking
 */

import { Router } from 'express';
import {
    getFinancialYears,
    getCurrentFinancialYear,
    createFinancialYear,
    lockFinancialYear,
    unlockFinancialYear,
    setCurrentFinancialYear,
    getFinancialPeriods,
    lockFinancialPeriod
} from '../controllers/financialYearController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// Get routes (all authenticated users)
router.get('/', getFinancialYears);
router.get('/current', getCurrentFinancialYear);

// Admin-only routes
router.post('/', authorize('OWNER', 'ADMIN'), createFinancialYear);
router.post('/:id/lock', authorize('OWNER', 'ADMIN'), lockFinancialYear);
router.post('/:id/unlock', authorize('OWNER', 'ADMIN'), unlockFinancialYear);
router.post('/:id/set-current', authorize('OWNER', 'ADMIN'), setCurrentFinancialYear);

// Period Management
router.get('/:id/periods', getFinancialPeriods);
router.post('/periods/:id/lock', authorize('OWNER', 'ADMIN'), lockFinancialPeriod);

export default router;
