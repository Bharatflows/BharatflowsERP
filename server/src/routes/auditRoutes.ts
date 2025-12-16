import express from 'express';
import { protect } from '../middleware/auth';
import { getEntityLogs, getGlobalLogs, verifyIntegrity } from '../controllers/auditController';

const router = express.Router();

router.use(protect);

router.get('/entity/:entityType/:entityId', getEntityLogs);
router.get('/global', getGlobalLogs);
router.post('/verify', verifyIntegrity);

export default router;
