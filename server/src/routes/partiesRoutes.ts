import express from 'express';
import { protect } from '../middleware/auth';
import { createParty, getParties, getParty, updateParty, deleteParty } from '../controllers/partiesController';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getParties)
    .post(createParty);

router.route('/:id')
    .get(getParty)
    .put(updateParty)
    .delete(deleteParty);

export default router;
