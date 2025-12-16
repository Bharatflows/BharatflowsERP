import express from 'express';
import { protect } from '../middleware/auth';
import {
    openSession,
    closeSession,
    createPOSOrder
} from '../controllers/posController_v2';

const router = express.Router();

router.use(protect);

router.post('/sessions/open', openSession);
router.post('/sessions/close', closeSession);

router.post('/orders', createPOSOrder);

export default router;
