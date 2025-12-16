import express from 'express';
import { protect } from '../middleware/auth';

const router = express.Router();
router.use(protect);

router.get('/', (req, res) => res.json({ success: true, message: 'Notifications endpoint - TODO' }));

export default router;
