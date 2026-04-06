import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getJobStatus } from '../controllers/jobController';

const router = Router();

// GET /api/v1/jobs/:queueName/:jobId
// Example: /api/v1/jobs/email/123
router.get('/:queueName/:jobId', protect, getJobStatus);

export default router;
