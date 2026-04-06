import { Router } from 'express';
import { lookupGSTIN, validateGSTIN } from '../controllers/gstinController';
import { protect } from '../middleware/auth';

const router = Router();

// GSTIN lookup - requires authentication
router.get('/:gstin', protect, lookupGSTIN);

// Public GSTIN lookup for registration
router.get('/public/:gstin', lookupGSTIN);

// GSTIN format validation only (can be public)
router.get('/validate/:gstin', validateGSTIN);

export default router;
