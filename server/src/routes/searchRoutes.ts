import express from 'express';
import { protect } from '../middleware/auth';
import { globalSearch } from '../controllers/searchController';

const router = express.Router();
router.use(protect);

router.get('/global', globalSearch);

export default router;
