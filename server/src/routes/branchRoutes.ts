/**
 * Branch Routes
 * 
 * P0-2: Multi-Branch/Multi-GSTIN API Endpoints
 */

import { Router } from 'express';
import {
    getBranches,
    getBranch,
    createBranch,
    updateBranch,
    deleteBranch,
    setPrimaryBranch
} from '../controllers/branchController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// List and view branches - all authenticated users
router.get('/', getBranches);
router.get('/:id', getBranch);

// Create, update, delete - ADMIN and above
router.post('/', authorize('ADMIN', 'OWNER'), createBranch);
router.put('/:id', authorize('ADMIN', 'OWNER'), updateBranch);
router.delete('/:id', authorize('ADMIN', 'OWNER'), deleteBranch);
router.post('/:id/set-primary', authorize('ADMIN', 'OWNER'), setPrimaryBranch);

export default router;
