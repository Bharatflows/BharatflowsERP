import express from 'express';
import { protect } from '../middleware/auth';
import { createParty, getParties, getParty, updateParty, deleteParty, getTrustScore, verifyBusiness } from '../controllers/partiesController';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getParties)
    .post(createParty);

router.post('/verify-business', verifyBusiness);


router.route('/:id')
    .get(getParty)
    .put(updateParty)
    .delete(deleteParty);

router.get('/:id/trust-score', getTrustScore);


export default router;
