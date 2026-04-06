import { Router } from 'express';
import hsnController from '../controllers/hsnController';
import { protect } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/categories', hsnController.getHSNCategories);

// Protected routes (require authentication)
router.get('/search', protect, hsnController.searchHSN);
router.get('/suggest', protect, hsnController.suggestHSNForProduct);
router.get('/:code', protect, hsnController.getHSNByCode);
router.get('/', protect, hsnController.getAllHSN);
router.post('/', protect, hsnController.createHSN);
router.post('/import', protect, hsnController.importHSNCodes);
router.delete('/:code', protect, hsnController.deleteHSN);

export default router;
